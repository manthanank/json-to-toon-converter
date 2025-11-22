import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Visit } from './models/visit.model';
import { Track } from './services/track';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('json-to-toon-converter');

  // --- State (Signal Forms style: individual control signals) ---
  jsonInput = signal<string>('');

  toonOutput = signal<string>('');
  inputHasError = signal<boolean>(false);
  inputErrorMessage = signal<string>('');
  copySuccess = signal<boolean>(false);
  darkMode = signal<boolean>(false);

  // --- Derived State ---
  canConvert = computed(() => !this.inputHasError() && this.jsonInput().trim().length > 0);

  canCopyOrDownload = computed(() => this.toonOutput().trim().length > 0);

  private trackService = inject(Track);

  // --- Effects --- (defined as field initializers to ensure injection context)
  private readonly validateEffect = effect(() => {
    this.validateJsonInput();
  });

  private readonly darkModeEffect = effect(() => {
    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  ngOnInit(): void {
    this.initializeDarkMode();
  }

  // Visitor count state - using toSignal() to convert Observable to Signal
  private visitResponse = toSignal<Visit | null>(
    this.trackService.trackProjectVisit(this.title()).pipe(
      catchError((err: Error) => {
        console.error('Failed to track visit:', err);
        return of(null);
      })
    ),
    { initialValue: null }
  );

  visitorCount = computed(() => this.visitResponse()?.uniqueVisitors ?? 0);
  isVisitorCountLoading = computed(() => this.visitResponse() === null);
  visitorCountError = computed(() => {
    // If visitResponse is null after loading, it means there was an error
    const response = this.visitResponse();
    return response === null && !this.isVisitorCountLoading()
      ? 'Failed to load visitor count'
      : null;
  });
  // --- Dark Mode (Standard) ---
  private initializeDarkMode(): void {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      this.darkMode.set(savedMode === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkMode.set(prefersDark);
    }
  }

  toggleDarkMode(): void {
    this.darkMode.update((current) => {
      const newValue = !current;
      localStorage.setItem('darkMode', newValue.toString());
      return newValue;
    });
  }

  // --- Validation ---
  validateJsonInput(): void {
    const input = this.jsonInput();
    if (!input.trim()) {
      this.inputHasError.set(false);
      this.inputErrorMessage.set('');
      return;
    }

    try {
      JSON.parse(input);
      this.inputHasError.set(false);
      this.inputErrorMessage.set('');
    } catch (error) {
      this.inputHasError.set(true);
      this.inputErrorMessage.set(
        `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // --- Actions ---
  clearInput(): void {
    this.jsonInput.set('');
    this.toonOutput.set('');
    this.inputHasError.set(false);
  }

  loadSampleJson(): void {
    // Sample data designed to show off TOON's tabular features
    this.jsonInput.set(`{
  "context": {
    "app": "converter",
    "version": 1.0
  },
  "users": [
    { "id": 1, "name": "Alice", "role": "admin", "active": true },
    { "id": 2, "name": "Bob", "role": "user", "active": false },
    { "id": 3, "name": "Charlie", "role": "guest", "active": true }
  ],
  "tags": ["development", "production", "testing"],
  "settings": {
    "notifications": {
      "email": true,
      "sms": false
    },
    "theme": "dark"
  }
}`);
  }

  convertJsonToToon() {
    try {
      const parsedJson = JSON.parse(this.jsonInput());
      // TOON spec: Root object keys are listed without braces
      const result = this.toToon(parsedJson, 0);
      this.toonOutput.set(result.trim());
    } catch (error) {
      this.toonOutput.set(
        `Error: ${error instanceof Error ? error.message : 'Invalid JSON input'}`
      );
    }
  }

  onJsonInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.jsonInput.set(value);
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.toonOutput()).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }

  downloadAsFile(): void {
    const blob = new Blob([this.toonOutput()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.toon'; // Official extension is .toon or .txt
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // --- CORE TOON CONVERSION LOGIC ---
  // Based on TOON Spec: https://github.com/toon-format/toon

  private toToon(obj: any, indentLevel: number = 0): string {
    if (obj === null) return 'null';
    if (obj === undefined) return '';

    const indent = '  '.repeat(indentLevel); // 2-space indentation

    // 1. Handle Primitives
    if (typeof obj !== 'object') {
      return this.formatPrimitive(obj);
    }

    // 2. Handle Arrays
    if (Array.isArray(obj)) {
      // Empty array
      if (obj.length === 0) return '[]';

      // Check if it's a "Uniform Array" (Array of Objects with same keys)
      // This is the key feature of TOON
      const isUniformObjects = obj.every(
        (item) => typeof item === 'object' && item !== null && !Array.isArray(item)
      );

      if (isUniformObjects && obj.length > 0) {
        const keys = Object.keys(obj[0]);
        // Verify all objects actually have the same keys (strict uniformity)
        const allSameKeys = obj.every((item) => {
          const itemKeys = Object.keys(item);
          return itemKeys.length === keys.length && keys.every((k) => itemKeys.includes(k));
        });

        if (allSameKeys) {
          // Render as Tabular TOON: keys[N]{k1,k2}: val,val...
          // Note: The key name comes from the parent property, but here we are just returning the value part.
          // In TOON, the array syntax `[N]{keys}:` is attached to the parent key.
          // We return a special marker object or handle it in the parent loop?
          // For simplicity in recursion, we will return the array body here,
          // but usually TOON arrays are defined at the property level like `users[2]{id}:`

          // Since we are inside the value generation, we can't easily change the parent key.
          // However, strictly speaking, standard TOON places the metadata on the key.
          // e.g. `users[3]{id,name}:`
          // If we are just converting the *value* part (like in a root array), it's tricky.
          // We will return the table content, but the parent method `formatKey` needs to handle the header.
          return `__TOON_TABLE__`;
        }
      }

      // Primitive Array: tags[3]: a, b, c
      // For converting the value *after* the key, we just return the CSV list
      const values = obj.map((v) => this.formatPrimitive(v)).join(',');
      return values;
    }

    // 3. Handle Objects (YAML-style indentation)
    let result = '';
    const keys = Object.keys(obj);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = obj[key];

      // Prepare key string
      let keyStr = `${indent}${key}`;

      // Check for Uniform Array to format header: `key[N]{columns}:`
      if (Array.isArray(value) && value.length > 0 && this.isUniformTable(value)) {
        const cols = Object.keys(value[0]).join(',');
        keyStr += `[${value.length}]{${cols}}:`;

        // Render rows
        const rows = value
          .map((row: any) => {
            return Object.values(row)
              .map((v) => this.formatPrimitive(v))
              .join(',');
          })
          .join('\n' + indent + '  '); // Indent rows slightly or align them

        // If it's not the first item, add newline before
        if (result) result += '\n';
        result += `${keyStr}\n${indent}  ${rows}`;
      } else if (Array.isArray(value)) {
        // Primitive/Mixed Array: `key[N]: val1,val2`
        keyStr += `[${value.length}]:`;
        const valStr = this.toToon(value, indentLevel);
        if (result) result += '\n';
        result += `${keyStr} ${valStr}`;
      } else if (typeof value === 'object' && value !== null) {
        // Nested Object: `key:` then newline + indent
        keyStr += `:`;
        const valStr = this.toToon(value, indentLevel + 1);
        if (result) result += '\n';
        result += `${keyStr}\n${valStr}`;
      } else {
        // Simple Primitive: `key: value`
        keyStr += `:`;
        const valStr = this.formatPrimitive(value);
        if (result) result += '\n';
        result += `${keyStr} ${valStr}`;
      }
    }

    return result;
  }

  private isUniformTable(arr: any[]): boolean {
    if (arr.length === 0) return false;
    const first = arr[0];
    if (typeof first !== 'object' || first === null || Array.isArray(first)) return false;
    const keys = Object.keys(first);
    if (keys.length === 0) return false;

    return arr.every((item) => {
      if (typeof item !== 'object' || item === null) return false;
      const itemKeys = Object.keys(item);
      return itemKeys.length === keys.length && keys.every((k) => itemKeys.includes(k));
    });
  }

  private formatPrimitive(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();

    // String handling: TOON only quotes if necessary
    // Necessary = contains delimiters (,:), newlines, or leading/trailing space
    const str = String(value);
    if (/[,:\n\r\t]/.test(str) || /^\s|\s$/.test(str)) {
      return JSON.stringify(str);
    }
    return str;
  }
}
