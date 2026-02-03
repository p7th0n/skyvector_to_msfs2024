import './style.css';
import { RouteParser, PlnGenerator, CoordinateConverter } from './converter.js';
import { InputValidator } from './validation.js';
import { FilenameUtils } from './filename-utils.js';

class SkyVectorConverter {
  private textInput!: HTMLTextAreaElement;
  private fileInput!: HTMLInputElement;
  private convertButton!: HTMLButtonElement;
  private outputPreview!: HTMLTextAreaElement;
  private downloadButton!: HTMLButtonElement;
  private copyButton!: HTMLButtonElement;
  private errorContainer!: HTMLDivElement;
  private successContainer!: HTMLDivElement;
  private fileUploadArea!: HTMLDivElement;
  private filenameInput!: HTMLInputElement;
  private filenameReset!: HTMLButtonElement;
  private filenameValidation!: HTMLDivElement;

  private currentDepartureId: string = '';
  private currentArrivalId: string = '';

  constructor() {
    this.initializeDOM();
    this.setupEventListeners();
    this.showExample();
  }

  private initializeDOM(): void {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App element not found');
    }

    app.innerHTML = `
      <div class="header">
        <h1>SkyVector to MSFS 2024 Converter</h1>
        <p>Convert SkyVector flight plans to Microsoft Flight Simulator 2024 .PLN format</p>
      </div>

      <div class="converter-container">
        <div class="card">
          <h2 class="section-title">Input</h2>
          
          <div class="file-upload" id="fileUpload">
            <div class="file-upload-icon">📁</div>
            <div class="file-upload-text">Drop a file here or click to select</div>
            <div class="file-upload-text" style="font-size: 0.9rem; color: #9ca3af;">Supports .txt and .pln files</div>
            <input type="file" id="fileInput" accept=".txt,.pln">
          </div>

          <textarea 
            id="textInput" 
            class="text-input" 
            placeholder="Or paste your SkyVector route here...&#10;&#10;Example:&#10;P34 403210N0772310W 402507N0773505W 401034N0774923W N68"
          ></textarea>

          <button id="convertButton" class="convert-button">
            Convert to MSFS 2024
          </button>

          <div id="errorContainer" class="error-message hidden"></div>
          <div id="successContainer" class="success-message hidden"></div>

          <div class="example">
            <div class="example-title">Example Input:</div>
            <div class="example-text">P34 403210N0772310W 402507N0773505W N68</div>
          </div>
        </div>

        <div class="card">
          <h2 class="section-title">Output</h2>
          
          <textarea 
            id="outputPreview" 
            class="output-preview" 
            readonly 
            placeholder="Your converted .PLN file will appear here..."
          ></textarea>

          <div class="filename-section">
            <label class="filename-label" for="filenameInput">Filename:</label>
            <div class="filename-container">
              <input 
                type="text" 
                id="filenameInput"
                class="filename-input"
                placeholder="filename.pln"
                disabled
              />
              <button id="filenameReset" class="filename-reset" disabled>
                Reset
              </button>
            </div>
            <div id="filenameValidation" class="filename-validation"></div>
          </div>

          <div class="output-actions">
            <button id="downloadButton" class="action-button" disabled>
              📥 Download .PLN
            </button>
            <button id="copyButton" class="action-button secondary" disabled>
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    `;

    this.textInput = document.getElementById('textInput') as HTMLTextAreaElement;
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.convertButton = document.getElementById('convertButton') as HTMLButtonElement;
    this.outputPreview = document.getElementById('outputPreview') as HTMLTextAreaElement;
    this.downloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
    this.copyButton = document.getElementById('copyButton') as HTMLButtonElement;
    this.errorContainer = document.getElementById('errorContainer') as HTMLDivElement;
    this.successContainer = document.getElementById('successContainer') as HTMLDivElement;
    this.fileUploadArea = document.getElementById('fileUpload') as HTMLDivElement;
    this.filenameInput = document.getElementById('filenameInput') as HTMLInputElement;
    this.filenameReset = document.getElementById('filenameReset') as HTMLButtonElement;
    this.filenameValidation = document.getElementById('filenameValidation') as HTMLDivElement;
  }

  private setupEventListeners(): void {
    this.convertButton.addEventListener('click', () => this.convertRoute());
    this.downloadButton.addEventListener('click', () => this.downloadPln());
    this.copyButton.addEventListener('click', () => this.copyToClipboard());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    this.fileUploadArea.addEventListener('click', () => this.fileInput.click());
    this.fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.fileUploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    this.fileUploadArea.addEventListener('dragleave', () => this.handleDragLeave());

    this.textInput.addEventListener('input', () => this.clearMessages());

    this.filenameInput.addEventListener('input', () => this.validateFilename());
    this.filenameReset.addEventListener('click', () => this.resetFilename());
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    this.fileUploadArea.classList.add('dragover');
  }

  private handleDragLeave(): void {
    this.fileUploadArea.classList.remove('dragover');
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.fileUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0]) {
      this.processFile(files[0]);
    }
  }

  private handleFileSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0 && files[0]) {
      this.processFile(files[0]);
    }
  }

  private async processFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      this.textInput.value = text;
      this.clearMessages();
      this.showSuccess(`File "${file.name}" loaded successfully`);
    } catch (error) {
      this.showError(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertRoute(): void {
    const inputText = this.textInput.value.trim();
    
    if (!inputText) {
      this.showError('Please enter a route or upload a file');
      return;
    }

    try {
      this.clearMessages();
      this.convertButton.disabled = true;
      this.convertButton.textContent = 'Converting...';

      const validationErrors = InputValidator.validateRouteInput(inputText);
      
      if (validationErrors.length > 0) {
        const errorMessage = InputValidator.generateHelpfulErrorMessage(validationErrors);
        this.showError(errorMessage);
        return;
      }

      const waypoints = RouteParser.parseSourceRoute(inputText);
      
      if (waypoints.length === 0) {
        throw new Error('No valid waypoints found in the input');
      }

      const plnResult = PlnGenerator.generatePln(waypoints);
      this.outputPreview.value = plnResult.content;
      
      // Store airport info and generate filename
      this.currentDepartureId = plnResult.departureId;
      this.currentArrivalId = plnResult.arrivalId;
      this.generateAndSetFilename();
      
      // Enable UI elements
      this.downloadButton.disabled = false;
      this.copyButton.disabled = false;
      this.filenameInput.disabled = false;
      this.filenameReset.disabled = false;
      
      this.showSuccess(`✅ Converted ${waypoints.length} waypoint(s) successfully`);

    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Conversion failed');
      this.outputPreview.value = '';
      this.downloadButton.disabled = true;
      this.copyButton.disabled = true;
      this.filenameInput.disabled = true;
      this.filenameReset.disabled = true;
      this.filenameInput.value = '';
      this.filenameValidation.textContent = '';
    } finally {
      this.convertButton.disabled = false;
      this.convertButton.textContent = 'Convert to MSFS 2024';
    }
  }

  private downloadPln(): void {
    const content = this.outputPreview.value;
    if (!content) return;

    try {
      const validation = FilenameUtils.validateAndSanitizeFilename(this.filenameInput.value);
      const filename = validation.sanitized;

      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.showSuccess(`Flight plan downloaded as: ${filename}`);
    } catch (error) {
      this.showError('Failed to download file');
    }
  }

  private generateAndSetFilename(): void {
    const filename = FilenameUtils.generateFlightPlanFilename(this.currentDepartureId, this.currentArrivalId);
    this.filenameInput.value = filename;
    this.validateFilename();
  }

  private resetFilename(): void {
    this.generateAndSetFilename();
  }

  private validateFilename(): void {
    const filename = this.filenameInput.value.trim();
    
    if (!filename) {
      this.filenameValidation.textContent = 'Filename cannot be empty';
      this.filenameValidation.className = 'filename-validation error';
      this.filenameInput.classList.add('invalid');
      this.downloadButton.disabled = true;
      return;
    }

    const validation = FilenameUtils.validateAndSanitizeFilename(filename);
    
    if (validation.isValid) {
      this.filenameValidation.textContent = '';
      this.filenameInput.classList.remove('invalid');
      this.downloadButton.disabled = false;
    } else {
      this.filenameValidation.textContent = validation.errors.join(', ');
      this.filenameValidation.className = 'filename-validation warning';
      this.filenameInput.classList.remove('invalid');
      
      // Update the field with sanitized version
      if (validation.sanitized !== filename) {
        this.filenameInput.value = validation.sanitized;
      }
      
      this.downloadButton.disabled = false; // Allow download with sanitized version
    }
  }

  private async copyToClipboard(): Promise<void> {
    const content = this.outputPreview.value;
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      this.showSuccess('Copied to clipboard');
    } catch (error) {
      this.showError('Failed to copy to clipboard');
      
      this.outputPreview.select();
      document.execCommand('copy');
      this.showSuccess('Copied to clipboard (fallback method)');
    }
  }

  private showError(message: string): void {
    this.clearMessages();
    this.errorContainer.textContent = message;
    this.errorContainer.classList.remove('hidden');
  }

  private showSuccess(message: string): void {
    this.clearMessages();
    this.successContainer.textContent = message;
    this.successContainer.classList.remove('hidden');
  }

  private clearMessages(): void {
    this.errorContainer.classList.add('hidden');
    this.successContainer.classList.add('hidden');
  }

  private showExample(): void {
    setTimeout(() => {
      this.textInput.value = 'P34 403210N0772310W 402507N0773505W 401034N0774923W N68';
    }, 500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SkyVectorConverter();
});