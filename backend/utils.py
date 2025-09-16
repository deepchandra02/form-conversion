"""
Simplified utils module for the Flask backend
"""
import os
import json
import tempfile
from pathlib import Path

def pdf_to_images(pdf_path, output_dir):
    """
    Simplified PDF to images conversion
    Returns (images_folder, page_count)
    """
    # Create a temporary directory for images
    os.makedirs(output_dir, exist_ok=True)
    images_folder = os.path.join(output_dir, Path(pdf_path).stem)
    os.makedirs(images_folder, exist_ok=True)

    # For now, simulate processing
    # In a real implementation, this would use pdf2image or similar
    page_count = 3  # Simulated page count

    return images_folder, page_count

def process_form_images(images_folder, filename):
    """
    Process form images and create sections
    Returns sections_directory
    """
    sections_dir = os.path.join(images_folder, "sections")
    os.makedirs(sections_dir, exist_ok=True)

    # Simulate creating section files
    for i in range(3):  # Simulate 3 sections
        section_name = f"section_{i}_{'title' if i == 0 else 'content'}.png"
        section_path = os.path.join(sections_dir, section_name)
        # Create empty file to simulate
        with open(section_path, 'w') as f:
            f.write("")

    return sections_dir

def chat(section_type, section_path):
    """
    Simulate AI chat processing
    Returns (response, tokens, cost)
    """
    tokens = 250  # Simulated token count
    cost = 0.005  # Simulated cost

    if section_type == "title":
        response = {
            "form_title": "Sample Form Title"
        }
    else:
        response = {
            "section_id": "section_1",
            "content": "Sample section content",
            "fields": []
        }

    return response, tokens, cost

def generate_af(json_file_path):
    """
    Generate AF content XML
    Returns content_xml string
    """
    content_xml = """<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0"
    jcr:primaryType="cq:Page">
    <jcr:content
        jcr:primaryType="cq:PageContent"
        jcr:title="Generated Form"
        sling:resourceType="fd/af/components/page/base"/>
</jcr:root>"""
    return content_xml

def sandbox_packager(form_code, last_modified_date):
    """
    Create sandbox package structure
    """
    package_dir = os.path.join("outputs", "generated_AF", form_code)
    os.makedirs(package_dir, exist_ok=True)

    # Create package structure
    content_path = os.path.join(package_dir, "jcr_root", "content", "forms", "af", "deep_test_2", form_code.lower())
    os.makedirs(content_path, exist_ok=True)

    # Create .content.xml file
    content_xml_path = os.path.join(content_path, ".content.xml")
    with open(content_xml_path, 'w') as f:
        f.write(generate_af(""))

def dev_packager(form_code, last_modified_date):
    """
    Create dev package structure
    """
    package_dir = os.path.join("outputs", "generated_AF", form_code)
    os.makedirs(package_dir, exist_ok=True)

    # Create package structure
    content_path = os.path.join(package_dir, "jcr_root", "content", "forms", "af", "pdf_converted_afforms", form_code.lower())
    os.makedirs(content_path, exist_ok=True)

    # Create .content.xml file
    content_xml_path = os.path.join(content_path, ".content.xml")
    with open(content_xml_path, 'w') as f:
        f.write(generate_af(""))

def process_json_strings(form_json):
    """
    Process JSON strings
    """
    return form_json

def copy_and_rename_zip_file(source_zip, destination_dir, new_name):
    """
    Copy and rename zip file
    """
    import shutil
    os.makedirs(destination_dir, exist_ok=True)
    dest_path = os.path.join(destination_dir, f"{new_name}.zip")

    # Create a simple zip file for simulation
    import zipfile
    with zipfile.ZipFile(dest_path, 'w') as zf:
        zf.writestr(f"{new_name}/README.txt", "Generated package")

def move_folder_to_zip(folder_path, zip_path):
    """
    Move folder contents to zip
    """
    import zipfile
    import shutil

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        if os.path.exists(folder_path):
            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arc_name = os.path.relpath(file_path, folder_path)
                    zf.write(file_path, arc_name)

    # Clean up folder
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)

def resource_path(relative_path):
    """
    Get absolute path to resource
    """
    return os.path.abspath(relative_path)