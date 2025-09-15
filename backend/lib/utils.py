import os
import sys
import json
import time
import random
import shutil
from pathlib import Path

def resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def pdf_to_images(pdf_path, output_directory):
    """
    Dummy function to simulate PDF to images conversion
    Returns (images_folder, page_count)
    """
    filename = os.path.basename(pdf_path)
    form_code = filename[:4]

    # Create output folder
    images_folder = os.path.join(output_directory, f"{form_code}_images")
    os.makedirs(images_folder, exist_ok=True)

    # Simulate creating image files
    page_count = random.randint(3, 12)  # Random number of pages

    for i in range(page_count):
        # Create dummy image file
        dummy_image_path = os.path.join(images_folder, f"page_{i+1}.png")
        with open(dummy_image_path, 'w') as f:
            f.write(f"Dummy image content for page {i+1}")

    print(f"Converted {filename} to {page_count} images (simulated)")
    return images_folder, page_count

def process_form_images(images_folder, filename):
    """
    Dummy function to simulate image segmentation into form sections
    Returns sections_directory
    """
    form_code = filename[:4]

    # Create sections directory
    sections_directory = os.path.join(os.path.dirname(images_folder), f"{form_code}_sections")
    os.makedirs(sections_directory, exist_ok=True)

    # Simulate creating section folders
    num_sections = random.randint(2, 8)

    # Always create a title section
    title_section_path = os.path.join(sections_directory, "section_0_title")
    os.makedirs(title_section_path, exist_ok=True)
    with open(os.path.join(title_section_path, "title_image.png"), 'w') as f:
        f.write("Dummy title section image")

    # Create other sections
    for i in range(1, num_sections):
        section_path = os.path.join(sections_directory, f"section_{i}")
        os.makedirs(section_path, exist_ok=True)
        with open(os.path.join(section_path, f"section_{i}_image.png"), 'w') as f:
            f.write(f"Dummy section {i} image")

    print(f"Segmented images into {num_sections} sections (simulated)")
    return sections_directory

def chat(section_type, section_path):
    """
    Dummy function to simulate GPT chat processing
    Returns (response, tokens, cost)
    """
    # Simulate processing time
    time.sleep(random.uniform(0.5, 2.0))

    tokens = random.randint(100, 1000)
    cost = tokens * 0.00001  # Dummy cost calculation

    if section_type == "title":
        response = {
            "form_title": f"Sample Form Title for {os.path.basename(section_path)}"
        }
    else:
        response = {
            "section_title": f"Section from {os.path.basename(section_path)}",
            "fields": [
                {
                    "field_name": "sample_field_1",
                    "field_type": "text",
                    "required": True
                },
                {
                    "field_name": "sample_field_2",
                    "field_type": "checkbox",
                    "required": False
                }
            ]
        }

    print(f"Processed {section_type} section: {os.path.basename(section_path)} (simulated)")
    return response, tokens, cost

def generate_af(json_file_path):
    """
    Dummy function to simulate AF generation
    Returns content_xml string
    """
    with open(json_file_path, 'r') as f:
        form_data = json.load(f)

    form_code = form_data.get('form_code', 'UNKN')

    # Generate dummy XML content
    content_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
          xmlns:cq="http://www.day.com/jcr/cq/1.0"
          xmlns:jcr="http://www.jcp.org/jcr/1.0"
          jcr:primaryType="cq:Page">
    <jcr:content
        jcr:primaryType="cq:PageContent"
        sling:resourceType="fd/af/components/page/base"
        cq:template="/libs/fd/af/templates/surveyTemplate"
        jcr:title="{form_data.get('form_title', 'Generated Form')}">
        <!-- Generated AF content for {form_code} -->
    </jcr:content>
</jcr:root>"""

    print(f"Generated AF content for {form_code} (simulated)")
    return content_xml

def sandbox_packager(form_code, last_modified_date):
    """
    Dummy function to simulate sandbox packaging
    """
    package_dir = os.path.join("outputs", "generated_AF", form_code)
    os.makedirs(package_dir, exist_ok=True)

    # Create dummy structure
    jcr_path = os.path.join(package_dir, "jcr_root", "content", "forms", "af", "deep_test_2", form_code.lower())
    os.makedirs(jcr_path, exist_ok=True)

    # Create dummy .content.xml
    content_xml_path = os.path.join(jcr_path, ".content.xml")
    with open(content_xml_path, 'w') as f:
        f.write("<!-- Dummy sandbox content.xml -->")

    print(f"Created sandbox package structure for {form_code} (simulated)")

def dev_packager(form_code, last_modified_date):
    """
    Dummy function to simulate dev packaging
    """
    package_dir = os.path.join("outputs", "generated_AF", form_code)
    os.makedirs(package_dir, exist_ok=True)

    # Create dummy structure
    jcr_path = os.path.join(package_dir, "jcr_root", "content", "forms", "af", "pdf_converted_afforms", form_code.lower())
    os.makedirs(jcr_path, exist_ok=True)

    # Create dummy .content.xml
    content_xml_path = os.path.join(jcr_path, ".content.xml")
    with open(content_xml_path, 'w') as f:
        f.write("<!-- Dummy dev content.xml -->")

    print(f"Created dev package structure for {form_code} (simulated)")

def process_json_strings(form_json):
    """
    Dummy function to simulate JSON processing
    """
    # In the real implementation, this would clean up JSON strings
    print("Processed JSON strings (simulated)")
    return form_json

def copy_and_rename_zip_file(source_zip, output_dir, new_name):
    """
    Dummy function to simulate zip file copying and renaming
    """
    output_path = os.path.join(output_dir, f"{new_name}.zip")

    # Create dummy zip file
    with open(output_path, 'w') as f:
        f.write(f"Dummy zip file content for {new_name}")

    print(f"Created zip file: {new_name}.zip (simulated)")

def move_folder_to_zip(folder_path, zip_path):
    """
    Dummy function to simulate moving folder contents to zip
    """
    print(f"Moved folder {folder_path} to zip {zip_path} (simulated)")

# Additional utility functions that might be needed
def select_directory(title="Select Directory"):
    """Dummy function for directory selection (originally from tkinter)"""
    return "/dummy/directory/path"

def select_file(title="Select File"):
    """Dummy function for file selection (originally from tkinter)"""
    return "/dummy/file/path.pdf"