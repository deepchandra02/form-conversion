Here’s a detailed, step-by-step breakdown of the logic and flow of main.py, including the config details step from gpt_chat.py, structured for redesigning the interface using Flask (backend) and Vite (frontend):

---

## 1. **Imports and Setup**

- Imports standard libraries (`configparser`, `json`, `os`, `sys`, `datetime`, `csv`, `time`).
- Imports Tkinter for GUI dialogs.
- Imports utility functions and modules for PDF/image processing, GPT chat, form creation, and packaging.

---

## 2. **Configuration Loading**

- Loads `.config` file using `configparser` to determine the packaging mode (`sandbox` or `dev`).
- Handles missing section/option errors gracefully.

---

## 3. **Secrets and API Details**

- Loads `secrets.json` for designer’s t-number and Azure OpenAI API details.
- If `secrets.json` does not exist, triggers a GUI dialog (from gpt_chat.py) to collect and save API key, endpoint, model name, API version, and t-number.
- This step must occur **before any processing** to ensure API credentials are available.

---

## 4. **Global Statistics Initialization**

- Initializes global counters for:
  - Total tokens used across all forms
  - Total cost across all forms
  - Total pages processed
  - Total sections processed

---

## 5. **CSV Data Structure**

- Prepares a list for CSV output, with headers:
  - date, form_code, no. of pages, no. of sections, total tokens, total cost

---

## 6. **GUI Dialogs (Tkinter)**

- **Batch Progress Dialog:** Shows batch progress, current file, elapsed time, and progress bar.
- **Choice Dialog:** Asks user to choose between batch or single PDF processing.
- **Conversion Screen:** Shows step-by-step progress for each PDF conversion (initializing, converting, segmenting, extracting code, processing sections, writing JSON, generating package).
- **Processing Complete Alert:** Notifies user when processing is complete and offers to open the output directory.

---

## 7. **CSV Output Function**

- Appends processed form data to a CSV file, adding the current date to each row.

---

## 8. **Core Conversion Function (`convertPDF`)**

- **Input Validation:** Checks filename format.
- **Window Management:** Updates or creates conversion progress window.
- **Step-by-Step Processing:**
  1. **Initialize:** Sets up form JSON structure with metadata.
  2. **PDF to Images:** Converts PDF to images, counts pages.
  3. **Image Segmentation:** Splits images into form sections.
  4. **Extract Form Code:** Gets form code from filename.
  5. **Process Sections:** For each section image:
     - Calls GPT chat to extract structured data.
     - Handles title and header extraction specially.
     - Accumulates tokens and cost.
  6. **Write JSON:** Saves structured form data to JSON file.
  7. **Generate AF Package:** Calls packaging function based on mode, updates `.content.xml`, zips output.
- **Statistics Update:** Updates global counters and CSV data.
- **Error Handling:** Shows error dialogs for exceptions.
- **Cleanup:** Cancels timers, releases window grabs, destroys windows as needed.

---

## 9. **Main Execution Flow**

- **Show Choice Dialog:** User selects batch or single PDF mode.
- **Directory Setup:** Ensures output directories exist.
- **Batch Mode:**
  - User selects PDF directory.
  - Finds all valid PDF files.
  - Shows batch progress dialog.
  - Processes each PDF file in sequence, updating dialogs and statistics.
- **Single Mode:**
  - User selects a single PDF file.
  - Processes the file.
- **Completion:**
  - Shows processing complete alert.
  - Calculates and prints average tokens/cost per page.
  - Appends summary data to CSV.

---

## 10. **Integration Point for Flask/Vite**

- **Replace Tkinter dialogs** with REST API endpoints and frontend modals/pages:
  - API for config/secrets setup (POST/GET `/api/config`)
  - API for PDF upload and batch/single selection (`/api/upload`, `/api/process`)
  - API for progress tracking (`/api/progress`)
  - API for results and statistics (`/api/results`)
- **Frontend (Vite):**
  - Pages for config entry, file selection, progress display, results summary.
  - Real-time updates via polling or websockets for progress.

---

## 11. **Sequence Including Config Step**

1. **Check for `secrets.json`** (API/config details).
   - If missing, prompt user to enter and save details (move this logic to Flask API and frontend form).
2. **Load `.config`** for packaging mode.
3. **Show processing mode choice** (batch/single).
4. **Collect file(s) from user**.
5. **Process files step-by-step**, updating progress and statistics.
6. **Show completion and results**.

---

## 12. **Key Data Flows**

- **Config/Secrets:** Must be set before any processing.
- **PDFs:** Uploaded or selected by user.
- **Progress:** Tracked and displayed per file/step.
- **Results:** Saved as JSON, packaged, and summarized in CSV.

---

This structure provides all the details needed to redesign the interface and backend logic using Flask and Vite, ensuring all user interactions, data flows, and processing steps are covered.
