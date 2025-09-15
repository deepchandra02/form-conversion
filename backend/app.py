import os
import json
import datetime
import configparser
import time
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import threading
from utils import (
    pdf_to_images,
    process_form_images,
    chat,
    generate_af,
    sandbox_packager,
    dev_packager,
    process_json_strings,
    copy_and_rename_zip_file,
    move_folder_to_zip,
    resource_path
)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUTS_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Global variables for tracking conversion progress and statistics
conversion_sessions = {}
global_stats = {
    'total_tokens_all_forms': 0,
    'total_cost_all_forms': 0,
    'total_pages_all_forms': 0,
    'total_sections_all_forms': 0
}

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUTS_FOLDER, exist_ok=True)
os.makedirs(os.path.join(OUTPUTS_FOLDER, 'images_of_pdfs'), exist_ok=True)
os.makedirs(os.path.join(OUTPUTS_FOLDER, 'json_outputs'), exist_ok=True)
os.makedirs(os.path.join(OUTPUTS_FOLDER, 'generated_AF'), exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_pdf_filename(filename):
    """Validate PDF filename format (first 4 characters should be alphabetic)"""
    name = filename.rsplit('.', 1)[0]
    return len(name) >= 4 and name[:4].isalpha()

class ConversionSession:
    def __init__(self, session_id, files, mode):
        self.session_id = session_id
        self.files = files
        self.mode = mode  # 'single' or 'batch'
        self.current_file_index = 0
        self.current_step = 0
        self.progress = 0
        self.status = 'pending'  # pending, processing, completed, error
        self.current_file = None
        self.start_time = time.time()
        self.steps = [
            "Initializing conversion process",
            "Converting PDF to high-quality images",
            "Segmenting images into form sections",
            "Extracting form code from file name",
            "Processing individual form sections",
            "Writing structured JSON data",
            "Generating final AF package"
        ]
        self.results = []
        self.error_message = None

    def to_dict(self):
        elapsed_time = int(time.time() - self.start_time)
        return {
            'session_id': self.session_id,
            'mode': self.mode,
            'total_files': len(self.files),
            'current_file_index': self.current_file_index,
            'current_file': self.current_file,
            'current_step': self.current_step,
            'total_steps': len(self.steps),
            'steps': self.steps,
            'progress': self.progress,
            'status': self.status,
            'elapsed_time': elapsed_time,
            'results': self.results,
            'error_message': self.error_message
        }

@app.route('/api/config', methods=['GET', 'POST'])
def handle_config():
    """Handle configuration and secrets management"""
    if request.method == 'GET':
        # Check if config files exist
        config_exists = os.path.exists('.config')
        secrets_exists = os.path.exists('secrets.json')

        config_data = {}
        secrets_data = {}

        if config_exists:
            config = configparser.ConfigParser()
            config.read('.config')
            try:
                config_data['packager_mode'] = config.get('packager', 'mode')
            except (configparser.NoSectionError, configparser.NoOptionError):
                config_data['packager_mode'] = None

        if secrets_exists:
            with open('secrets.json', 'r') as f:
                secrets_data = json.load(f)

        return jsonify({
            'config_exists': config_exists,
            'secrets_exists': secrets_exists,
            'config': config_data,
            'secrets': secrets_data
        })

    elif request.method == 'POST':
        data = request.json

        # Save config file
        config = configparser.ConfigParser()
        config.add_section('packager')
        config.set('packager', 'mode', data.get('packager_mode', 'sandbox'))

        with open('.config', 'w') as f:
            config.write(f)

        # Save secrets file
        secrets = {
            'T_NUMBER': data.get('t_number', ''),
            'AZURE_OPENAI_API_KEY': data.get('api_key', ''),
            'AZURE_OPENAI_ENDPOINT': data.get('endpoint', ''),
            'MODEL_NAME': data.get('model_name', ''),
            'API_VERSION': data.get('api_version', '')
        }

        with open('secrets.json', 'w') as f:
            json.dump(secrets, f, indent=4)

        return jsonify({'success': True, 'message': 'Configuration saved successfully'})

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Handle file upload and create conversion session"""
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files')
    mode = request.form.get('mode', 'single')

    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No files selected'}), 400

    uploaded_files = []

    for file in files:
        if file and allowed_file(file.filename):
            if not validate_pdf_filename(file.filename):
                return jsonify({
                    'error': f'Invalid filename format: {file.filename}. First 4 characters must be alphabetic.'
                }), 400

            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            uploaded_files.append(filename)
        else:
            return jsonify({'error': f'Invalid file type: {file.filename}'}), 400

    # Create conversion session
    session_id = str(uuid.uuid4())
    session = ConversionSession(session_id, uploaded_files, mode)
    conversion_sessions[session_id] = session

    return jsonify({
        'session_id': session_id,
        'files': uploaded_files,
        'mode': mode
    })

@app.route('/api/process/<session_id>', methods=['POST'])
def start_processing(session_id):
    """Start processing the uploaded files"""
    if session_id not in conversion_sessions:
        return jsonify({'error': 'Session not found'}), 404

    session = conversion_sessions[session_id]

    if session.status != 'pending':
        return jsonify({'error': 'Session already processed or in progress'}), 400

    # Start processing in a separate thread
    thread = threading.Thread(target=process_files, args=(session,))
    thread.daemon = True
    thread.start()

    return jsonify({'success': True, 'message': 'Processing started'})

@app.route('/api/progress/<session_id>', methods=['GET'])
def get_progress(session_id):
    """Get the current progress of a conversion session"""
    if session_id not in conversion_sessions:
        return jsonify({'error': 'Session not found'}), 404

    session = conversion_sessions[session_id]
    return jsonify(session.to_dict())

@app.route('/api/results/<session_id>', methods=['GET'])
def get_results(session_id):
    """Get the results of a completed conversion session"""
    if session_id not in conversion_sessions:
        return jsonify({'error': 'Session not found'}), 404

    session = conversion_sessions[session_id]

    if session.status != 'completed':
        return jsonify({'error': 'Session not completed yet'}), 400

    return jsonify({
        'session_id': session_id,
        'results': session.results,
        'global_stats': global_stats
    })

@app.route('/api/download/<path:filename>')
def download_file(filename):
    """Download generated files"""
    try:
        return send_from_directory(OUTPUTS_FOLDER, filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

def process_files(session):
    """Process files in a conversion session"""
    global global_stats

    try:
        session.status = 'processing'

        # Load configuration
        config = configparser.ConfigParser()
        config.read('.config')
        packager_mode = config.get('packager', 'mode', fallback='sandbox')

        # Load secrets
        with open('secrets.json', 'r') as f:
            secrets = json.load(f)
        t_number = secrets.get('T_NUMBER')

        for file_index, filename in enumerate(session.files):
            session.current_file_index = file_index
            session.current_file = filename

            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            # Process each step for this file
            result = process_single_file(session, filename, filepath, packager_mode, t_number)
            session.results.append(result)

            # Update overall progress
            session.progress = ((file_index + 1) / len(session.files)) * 100

        session.status = 'completed'

    except Exception as e:
        session.status = 'error'
        session.error_message = str(e)

def process_single_file(session, filename, filepath, packager_mode, t_number):
    """Process a single PDF file through all steps"""
    try:
        form_code = filename[:4]

        # Initialize form JSON
        formatted_date = datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat()
        form_json = {
            "form_code": form_code,
            "form_title": "",
            "last_modified_date": formatted_date,
            "last_modified_by": t_number,
            "sections": []
        }

        total_cost = 0
        total_tokens = 0
        num_sections = 0

        # Step 1: Initialize
        session.current_step = 0
        time.sleep(1)  # Simulate processing time

        # Step 2: Convert PDF to images
        session.current_step = 1
        images_folder, page_count = pdf_to_images(filepath, os.path.join(OUTPUTS_FOLDER, 'images_of_pdfs'))
        time.sleep(2)  # Simulate processing time

        # Step 3: Segment images
        session.current_step = 2
        sections_directory = process_form_images(images_folder, filename)
        time.sleep(2)

        # Step 4: Extract form code
        session.current_step = 3
        # Form code already extracted
        time.sleep(1)

        # Step 5: Process sections
        session.current_step = 4
        sections = os.listdir(sections_directory) if os.path.exists(sections_directory) else []

        for section in sorted(sections):
            section_path = os.path.join(sections_directory, section)
            section_type = "title" if "section_0_title" in section else "section"

            response, tokens, cost = chat(section_type, section_path)
            total_cost += cost
            total_tokens += tokens
            num_sections += 1

            if response and section_type == "title":
                form_json["form_title"] = response.get("form_title", "")
            elif response:
                form_json["sections"].append(response)

        time.sleep(3)

        # Step 6: Write JSON
        session.current_step = 5
        json_filename = f"{form_code}_input_for_af.json"
        output_file_path = os.path.join(OUTPUTS_FOLDER, 'json_outputs', json_filename)

        form_json = process_json_strings(form_json)
        with open(output_file_path, 'w') as f:
            json.dump(form_json, f, indent=4)

        time.sleep(1)

        # Step 7: Generate AF package
        session.current_step = 6
        content_xml = generate_af(output_file_path)

        # Package based on mode
        if packager_mode == "sandbox":
            sandbox_packager(form_code, form_json["last_modified_date"])
            package_name = f"{form_code}_SANDBOX"
        else:
            dev_packager(form_code, form_json["last_modified_date"])
            package_name = f"{form_code}_DEV"

        time.sleep(2)

        # Update global statistics
        global_stats['total_tokens_all_forms'] += total_tokens
        global_stats['total_cost_all_forms'] += total_cost
        global_stats['total_pages_all_forms'] += page_count
        global_stats['total_sections_all_forms'] += num_sections

        return {
            'filename': filename,
            'form_code': form_code,
            'page_count': page_count,
            'num_sections': num_sections,
            'total_tokens': total_tokens,
            'total_cost': total_cost,
            'package_name': package_name,
            'json_file': json_filename,
            'status': 'completed'
        }

    except Exception as e:
        return {
            'filename': filename,
            'status': 'error',
            'error': str(e)
        }

if __name__ == '__main__':
    app.run(debug=True, port=5001)