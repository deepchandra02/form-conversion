import configparser
import json
import os
import sys
import datetime
import csv
import time
from tkinter import (
    Tk,
    Toplevel,
    Label,
    Button,
    StringVar,
    messagebox,
    ttk,
    Frame,
)
import tkinter as tk
from utils.lib import *
from utils.image_splitter import *
from utils.gpt_chat import chat
from utils.form_creator import generate_af
from utils.packager import sandbox_packager, dev_packager

# Setting up .config file
config_path = resource_path(".config")
config = configparser.ConfigParser()
config.read(config_path)

try:
    packager_mode = config.get("packager", "mode")
    print(f"Packager mode: {packager_mode}")
except configparser.NoSectionError:
    print("No section 'packager' found in the configuration file.")
except configparser.NoOptionError:
    print("No option 'mode' found in the 'packager' section.")

# reading secrets.json for designer's t_number
secrets_path = resource_path("secrets.json")
with open(secrets_path, "r") as t_info:
    secrets = json.load(t_info)


# Initialize global variables for overall statistics
t_number = secrets.get("T_NUMBER")
total_tokens_all_forms = 0
total_cost_all_forms = 0
total_pages_all_forms = 0
total_sections_all_forms = 0

# Create a list to store CSV data
csv_data = [
    [
        "date",
        "form_code",
        "no. of pages",
        "no. of sections",
        "total tokens for form",
        "total cost for form",
    ]
]


# Functions
## Batch Progress Dialog
def create_batch_progress_dialog(parent=None):
    dialog = Toplevel(parent)
    dialog.title("Batch Conversion Progress")
    dialog.geometry("500x200")
    dialog.configure(bg="#f0f0f0")
    dialog.resizable(False, False)

    # Position the window on the left side of the screen
    window_width = 500
    window_height = 200
    screen_width = dialog.winfo_screenwidth()
    screen_height = dialog.winfo_screenheight()
    x_pos = (screen_width // 2) - window_width - 20  # Position on left side
    y_pos = (screen_height - window_height) // 2
    dialog.geometry(f"{window_width}x{window_height}+{x_pos}+{y_pos}")

    # Title label
    title_label = Label(
        dialog, text="PDF Batch Conversion", font=("Arial", 16, "bold"), bg="#f0f0f0"
    )
    title_label.pack(pady=(20, 15))

    # Current file label
    current_file_var = StringVar()
    current_file_var.set("Preparing...")
    current_file_label = Label(
        dialog, textvariable=current_file_var, font=("Arial", 10), bg="#f0f0f0"
    )
    current_file_label.pack(pady=5)

    # Progress counter
    counter_var = StringVar()
    counter_var.set("File 0 of 0")
    counter_label = Label(
        dialog, textvariable=counter_var, font=("Arial", 12, "bold"), bg="#f0f0f0"
    )
    counter_label.pack(pady=5)

    # Overall progress bar
    progress_bar = ttk.Progressbar(
        dialog, orient="horizontal", mode="determinate", length=450
    )
    progress_bar.pack(pady=15)

    # Elapsed time
    time_var = StringVar()
    time_var.set("Elapsed time: 00:00")
    time_label = Label(
        dialog, textvariable=time_var, font=("Arial", 9), fg="#555555", bg="#f0f0f0"
    )
    time_label.pack(pady=5)

    # Store variables for later updates
    dialog.counter_var = counter_var
    dialog.current_file_var = current_file_var
    dialog.progress_bar = progress_bar
    dialog.time_var = time_var
    dialog.start_time = time.time()

    # Start timer update
    def update_timer():
        elapsed = time.time() - dialog.start_time
        minutes = int(elapsed // 60)
        seconds = int(elapsed % 60)
        dialog.time_var.set(f"Elapsed time: {minutes:02d}:{seconds:02d}")
        dialog.after(1000, update_timer)

    update_timer()
    return dialog


## GUI - Batch process or Single PDF
def show_choice_dialog():
    def on_batch_process():
        global choice
        choice = "batch"
        root.destroy()

    def on_single_pdf():
        global choice
        choice = "single"
        root.destroy()

    root = Tk()
    root.title("Select Processing Mode")

    label = Label(
        root,
        text="Do you want to convert a batch of PDF files or only one PDF? Ensure that the pdfs are named in the [<formcode><optional_characters>.pdf] format, i.e. ABIC_en.pdf or AAAX.pdf",
    )
    label.pack(pady=10)

    batch_button = Button(root, text="Batch Process", command=on_batch_process)
    batch_button.pack(pady=5)

    single_button = Button(root, text="Single PDF", command=on_single_pdf)
    single_button.pack(pady=5)

    root.mainloop()


## GUI - Conversion screen
def show_converting_screen(
    filename, is_batch=False, parent=None, is_first_batch_file=False
):
    if parent is None:
        root = Tk()
        root.withdraw()
    else:
        root = parent

    # Create the window but initially hide it
    converting_screen = Toplevel(root)
    converting_screen.withdraw()
    converting_screen.title("Converting...")
    converting_screen.geometry("600x400")
    converting_screen.configure(bg="#f0f0f0")
    converting_screen.resizable(False, False)

    # Position the window based on whether it's batch mode or not
    window_width = 600
    window_height = 400
    screen_width = converting_screen.winfo_screenwidth()
    screen_height = converting_screen.winfo_screenheight()

    if is_batch:
        # In batch mode, position on the right side of the screen
        x_pos = (screen_width // 2) + 20  # Position on right side
        y_pos = (screen_height - window_height) // 2
    else:
        # In single mode, center the window
        x_pos = (screen_width - window_width) // 2
        y_pos = (screen_height - window_height) // 2

    converting_screen.geometry(f"{window_width}x{window_height}+{x_pos}+{y_pos}")

    # Title label
    title_label = Label(
        converting_screen,
        text="PDF Conversion",
        font=("Arial", 18, "bold"),
        bg="#f0f0f0",
    )
    title_label.pack(pady=(15, 5))

    # File name display
    file_label = Label(
        converting_screen,
        text=f"Converting: {filename}",
        font=("Arial", 12, "bold"),
        bg="#f0f0f0",
    )
    file_label.pack(pady=(5, 15))
    file_label.name = "filename_label"

    # Create frame for step tracking
    steps_frame = Frame(converting_screen, bg="#f0f0f0")
    steps_frame.pack(fill="both", expand=True, padx=30, pady=10)
    steps_frame.name = "steps_frame"

    # Define steps
    steps = [
        "Initializing conversion process",
        "Converting PDF to high-quality images",
        "Segmenting images into form sections",
        "Extracting form code from file name",
        "Processing individual form sections",
        "Writing structured JSON data",
        "Generating final AF package",
    ]

    # Create status icons for each step
    step_labels = []
    status_labels = []

    for i, step_text in enumerate(steps):
        # Create a frame for each step
        step_frame = Frame(steps_frame, bg="#f0f0f0")
        step_frame.pack(fill="x", pady=5, anchor="w")

        # Status icon (Unicode characters)
        status_icon = Label(
            step_frame,
            text="○",
            font=("Arial", 14),
            bg="#f0f0f0",
            fg="#AAAAAA",
            width=2,
        )
        status_icon.pack(side="left")
        status_labels.append(status_icon)

        # Step text label (grayed out initially)
        step_label = Label(
            step_frame, text=step_text, font=("Arial", 10), bg="#f0f0f0", fg="#888888"
        )
        step_label.pack(side="left", padx=5, anchor="w")
        step_labels.append(step_label)

    # Store the step widgets
    converting_screen.status_labels = status_labels
    converting_screen.step_labels = step_labels

    # Add a progress bar
    progress_bar = ttk.Progressbar(
        converting_screen, orient="horizontal", mode="determinate", length=540
    )
    progress_bar.pack(pady=15)
    converting_screen.progress_bar = progress_bar

    # Elapsed time
    time_var = StringVar()
    time_var.set("Time: 00:00")
    time_label = Label(
        converting_screen,
        textvariable=time_var,
        font=("Arial", 9),
        fg="#555555",
        bg="#f0f0f0",
    )
    time_label.pack(pady=(5, 0))

    # Store timer variable
    converting_screen.time_var = time_var
    converting_screen.start_time = time.time()

    # Function to update the timer
    def update_timer():
        elapsed = time.time() - converting_screen.start_time
        minutes = int(elapsed // 60)
        seconds = int(elapsed % 60)
        converting_screen.time_var.set(f"Time: {minutes:02d}:{seconds:02d}")
        converting_screen.timer_id = converting_screen.after(1000, update_timer)

    # Start the timer
    update_timer()

    # Store whether this is part of batch processing
    converting_screen.is_batch = is_batch

    # Set window attributes for focus control
    converting_screen.wm_attributes("-topmost", 0)  # Not topmost

    # Make window behavior appropriate for mode
    converting_screen.update()

    # Only for single files or first batch file
    if not is_batch or is_first_batch_file:
        converting_screen.wm_attributes("-topmost", 1)  # Make topmost
        converting_screen.deiconify()
        converting_screen.lift()
        converting_screen.focus_force()
        # Reset topmost after focus
        converting_screen.after(
            100, lambda: converting_screen.wm_attributes("-topmost", 0)
        )
    else:
        # For subsequent batch files, don't focus
        converting_screen.deiconify()
        converting_screen.lower()

    return converting_screen


## GUI - End screen showing output directory
def show_processing_complete_alert(outputs_directory):
    def open_outputs_directory():
        # Open the outputs directory using Windows-specific command
        os.startfile(outputs_directory)

    # Create a root window to ensure dialog comes to front
    root = Tk()
    root.withdraw()

    # Force window to the front
    root.attributes("-topmost", True)

    # Create a simple info dialog with a custom button
    response = messagebox.showinfo(
        "Processing Complete",
        "The PDF processing is complete. Click OK to view the outputs.",
        icon=messagebox.INFO,
        parent=root,
    )

    if response == "ok":
        open_outputs_directory()

    # Clean up the root window
    root.destroy()


## Function to append data to CSV
def append_to_csv(csv_output, data):
    file_exists = os.path.exists(csv_output)

    # Get the current date
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")

    # Add the date to each row of data
    for row in data[1:]:  # Skip the header row
        row.insert(0, current_date)

    # Open the file in append mode if it exists, otherwise in write mode
    with open(csv_output, "a" if file_exists else "w", newline="") as csv_file:
        writer = csv.writer(csv_file)

        # Write the header only if the file does not exist
        if not file_exists:
            writer.writerow(data[0])

        # Write the data rows
        writer.writerows(data[1:])


## Core conversion function
def convertPDF(
    filename,
    pdf_path,
    is_batch=False,
    is_first_batch_file=False,
    root=None,
    existing_window=None,
):
    global t_number
    global total_tokens_all_forms
    global total_cost_all_forms
    global total_pages_all_forms
    global total_sections_all_forms

    if filename.endswith(".pdf") and filename[:4].isalpha():
        # Create a new window or update existing one
        if is_batch and existing_window:
            # Update existing window for this file
            converting_screen = existing_window
            # Update the filename display
            for widget in converting_screen.winfo_children():
                if hasattr(widget, "name") and widget.name == "filename_label":
                    widget.config(text=f"Converting: {filename}")

            # Reset step statuses
            for status_label in converting_screen.status_labels:
                status_label.config(text="○", fg="#AAAAAA")
            for step_label in converting_screen.step_labels:
                step_label.config(fg="#888888")

            # Reset progress bar
            converting_screen.progress_bar["value"] = 0

            # Reset timer
            converting_screen.start_time = time.time()
            converting_screen.time_var.set("Time: 00:00")
        else:
            # Create a new window
            converting_screen = show_converting_screen(
                filename, is_batch, parent=root, is_first_batch_file=is_first_batch_file
            )
            converting_screen.update()

        # Make modal if it's a single file conversion
        if not is_batch:
            converting_screen.grab_set()

        # Keep reference to the root window to prevent garbage collection
        root = converting_screen.master

        # Total number of steps
        total_steps = len(converting_screen.step_labels)

        # Update a specific step's status
        def update_step_status(step_index, status):
            status_label = converting_screen.status_labels[step_index]
            step_label = converting_screen.step_labels[step_index]

            # Update the icon and color based on status
            if status == "waiting":
                status_label.config(text="○", fg="#AAAAAA")  # Empty circle, gray
                step_label.config(fg="#888888")  # Gray text
            elif status == "active":
                status_label.config(text="◉", fg="#0056b3")  # Filled circle, blue
                step_label.config(fg="#0056b3")  # Blue text
            elif status == "completed":
                status_label.config(text="✓", fg="#28a745")  # Checkmark, green
                step_label.config(fg="#28a745")  # Green text

            # Update progress bar
            completed = sum(
                1
                for i in range(total_steps)
                if i < step_index or (i == step_index and status == "completed")
            )
            progress_value = (completed / total_steps) * 100
            converting_screen.progress_bar["value"] = progress_value

            converting_screen.update()

        try:
            # STEP 1: Initializing conversion
            update_step_status(0, "active")

            formatted_date = (
                datetime.datetime.now(datetime.timezone.utc).astimezone()
            ).strftime("%Y-%m-%dT%H:%M:%S.%f%z")
            formatted_date = formatted_date[:-9] + formatted_date[-6:]
            formatted_date = formatted_date[:-2] + ":" + formatted_date[-2:]
            form_json = {
                "form_code": "",
                "form_title": "",
                "last_modified_date": formatted_date,
                "last_modified_by": t_number,
                "sections": [],
            }

            converting_screen.update()
            update_step_status(0, "completed")

            # STEP 2: Converting PDF to images
            update_step_status(1, "active")
            images_folder, page_count = pdf_to_images(pdf_path, images_directory)
            print(f"Converted {filename} to images.")

            converting_screen.update()
            update_step_status(1, "completed")

            # STEP 3: Segmenting images
            update_step_status(2, "active")

            sections_directory = process_form_images(images_folder, filename)

            converting_screen.update()
            update_step_status(2, "completed")

            # STEP 4: Extracting form code
            update_step_status(3, "active")

            form_code = filename[:4]
            form_json["form_code"] = form_code
            total_cost = 0
            total_tokens = 0
            num_sections = 0

            converting_screen.update()
            update_step_status(3, "completed")

            # STEP 5: Processing form sections
            update_step_status(4, "active")

            for section in sorted(os.listdir(sections_directory)):
                section_path = os.path.join(sections_directory, section)
                # Get the form title from the very first image
                if "section_0_title" in section:
                    section_type = "title"
                else:
                    section_type = "section"

                # print(f"Type: {section_type}, Name: {section}")

                response, tokens, cost = chat(section_type, section_path)
                total_cost += cost
                total_tokens += tokens
                num_sections += 1
                if response == "":
                    print(f"{section} - Couldn't process this section, skipping...")
                    continue
                elif section_type == "title":
                    form_json["form_title"] = response[0]["form_title"]

                    if len(response) > 1:
                        header_details = [
                            {"heading": "Detected header details"},
                            {"headers": []},
                        ]
                        for items in response[1:]:
                            header_details[1]["headers"].append(items)

                        form_json["sections"].append(header_details)
                else:
                    form_json["sections"].append(response)

            # Update overall statistics
            total_tokens_all_forms += total_tokens
            total_cost_all_forms += total_cost
            total_pages_all_forms += page_count
            total_sections_all_forms += num_sections

            # Append form details to CSV data
            csv_data.append(
                [form_code, page_count, num_sections, total_tokens, total_cost]
            )

            converting_screen.update()
            update_step_status(4, "completed")

            # STEP 6: Writing JSON data
            update_step_status(5, "active")

            json_filename = f"""{form_code}_input_for_af.json"""
            output_file_path = os.path.join(json_outputs, json_filename)
            form_json = process_json_strings(form_json)
            with open(output_file_path, "w") as json_file:
                json.dump(form_json, json_file, indent=4)

            converting_screen.update()
            update_step_status(5, "completed")

            # STEP 7: Generating AF package
            update_step_status(6, "active")

            content_xml = generate_af(output_file_path)

            # Create the crx package for this form based on the packager mode
            if packager_mode == "sandbox":
                sandbox_packager(form_code, form_json["last_modified_date"])
                # new .content.xml file path
                content_xml_file_path = resource_path(
                    f"../outputs/generated_AF/{form_code}/jcr_root/content/forms/af/deep_test_2/{form_code.lower()}/.content.xml"
                )

                # Replace the content.xml content with the generated one
                with open(content_xml_file_path, "w") as file:
                    file.write(content_xml)

                # Create a copy of the blank zipped file with form_code name
                copy_and_rename_zip_file(
                    resource_path("blank_zipped_file.zip"),
                    resource_path("../outputs/generated_AF"),
                    f"{form_code}_SANDBOX",
                )
                # Move the folders from source folder into the zipped folder
                move_folder_to_zip(
                    resource_path(f"../outputs/generated_AF/{form_code}"),
                    resource_path(f"../outputs/generated_AF/{form_code}_SANDBOX.zip"),
                )
            elif packager_mode == "dev":
                dev_packager(form_code, form_json["last_modified_date"])
                # new .content.xml file path
                content_xml_file_path = resource_path(
                    f"../outputs/generated_AF/{form_code}/jcr_root/content/forms/af/pdf_converted_afforms/{form_code.lower()}/.content.xml"
                )

                # Replace the content.xml content with the generated one
                with open(content_xml_file_path, "w") as file:
                    file.write(content_xml)

                # Create a copy of the blank zipped file with form_code name
                copy_and_rename_zip_file(
                    resource_path("blank_zipped_file.zip"),
                    resource_path("../outputs/generated_AF"),
                    f"{form_code}_DEV",
                )
                # Move the folders from source folder into the zipped folder
                move_folder_to_zip(
                    resource_path(f"../outputs/generated_AF/{form_code}"),
                    resource_path(f"../outputs/generated_AF/{form_code}_DEV.zip"),
                )
            else:
                raise RuntimeError("Unsupported or incorrect packager mode in .config")

            converting_screen.update()
            update_step_status(6, "completed")

        except Exception as e:
            messagebox.showerror(
                "Error", f"An error occurred during conversion: {str(e)}"
            )
        finally:
            # Cancel the timer
            if hasattr(converting_screen, "timer_id"):
                converting_screen.after_cancel(converting_screen.timer_id)

            # Release grab if used
            try:
                converting_screen.grab_release()
            except:
                pass

            # Only destroy window if not in batch mode or if it's the last file
            if not is_batch:
                converting_screen.after(500, converting_screen.destroy)

    else:
        messagebox.showerror("Error", "PDF filename format is incorrect!")
        sys.exit()


# Launch GUI to get user-defined paths
show_choice_dialog()

images_directory = resource_path("../outputs/images_of_pdfs")
json_outputs = resource_path("../outputs/json_outputs")
generated_AF = resource_path("../outputs/generated_AF")

# Ensure the output directories exist
if not os.path.exists(images_directory):
    os.makedirs(images_directory)
if not os.path.exists(json_outputs):
    os.makedirs(json_outputs)

if choice == "batch":
    pdfs_directory = select_directory("Select the PDFs directory")

    # 1. Find all PDF files in the directory
    pdf_files = [
        f
        for f in os.listdir(pdfs_directory)
        if (f.endswith(".pdf") and f[:4].isalpha())
    ]
    total_files = len(pdf_files)

    if total_files == 0:
        messagebox.showinfo(
            "No PDFs Found", "No PDF files were found in the selected directory."
        )
    else:
        # Create a single root window for all dialogs
        root = Tk()
        root.withdraw()

        # Create batch progress dialog
        batch_dialog = create_batch_progress_dialog(root)
        batch_dialog.counter_var.set(f"File 0 of {total_files}")
        batch_dialog.progress_bar["maximum"] = total_files
        batch_dialog.progress_bar["value"] = 0
        batch_dialog.update()

        # Create a single conversion window to reuse for all files
        conversion_window = None

        # Process each PDF file
        for i, filename in enumerate(pdf_files):
            # Update batch progress
            current_index = i + 1
            batch_dialog.counter_var.set(f"File {current_index} of {total_files}")
            batch_dialog.current_file_var.set(f"Converting: {filename}")
            batch_dialog.progress_bar["value"] = current_index
            batch_dialog.update()

            # Ensure batch dialog is visible but not stealing focus
            if i > 0:  # Only after first file
                batch_dialog.update()

            # Process the file
            pdf_file_path = os.path.join(pdfs_directory, filename)
            # Create window for first file, reuse for subsequent files
            if i == 0:
                conversion_window = show_converting_screen(
                    filename, True, parent=root, is_first_batch_file=True
                )
                convertPDF(
                    filename,
                    pdf_file_path,
                    is_batch=True,
                    is_first_batch_file=True,
                    root=root,
                    existing_window=conversion_window,
                )
            else:
                # Reuse existing window
                convertPDF(
                    filename,
                    pdf_file_path,
                    is_batch=True,
                    is_first_batch_file=False,
                    root=root,
                    existing_window=conversion_window,
                )

        # Clean up
        batch_dialog.destroy()
        if conversion_window and conversion_window.winfo_exists():
            conversion_window.destroy()

elif choice == "single":
    pdf_file_path = select_file("Select the PDF file")

    # Ensure the filename matches the required format
    filename = os.path.basename(pdf_file_path)
    convertPDF(filename, pdf_file_path, is_batch=False)

show_processing_complete_alert(generated_AF)

# Calculate overall average tokens per page and average cost per page
average_tokens_per_page = (
    total_tokens_all_forms / total_pages_all_forms if total_pages_all_forms > 0 else 0
)
average_cost_per_page = (
    total_cost_all_forms / total_pages_all_forms if total_pages_all_forms > 0 else 0
)

print("Average tokens per page across all forms:", average_tokens_per_page)
print("Average cost per page across all forms:", average_cost_per_page)

# Append the data to the CSV file
csv_output = resource_path("../outputs/form_summary.csv")
append_to_csv(csv_output, csv_data)
