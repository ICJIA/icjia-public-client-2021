# Project Analysis and Documentation Framework v2.0

## Overview

This comprehensive framework provides a systematic approach to analyzing and documenting any Node.js/web development project. It produces professional-grade documentation with automated HTML generation, comprehensive developer onboarding guides, and integrated build processes.

## Prerequisites

### Platform Requirements

⚠️ **IMPORTANT PLATFORM COMPATIBILITY WARNING** ⚠️

This project framework is **NOT compatible with vanilla Windows** (native Windows without WSL2). Development requires one of these supported platforms:

1. **Windows with WSL2** (Windows Subsystem for Linux 2) - **REQUIRED** for Windows users
2. **macOS** (Apple Silicon M1/M2/M3/M4 preferred over Intel for better performance)
3. **Linux** (Debian/Ubuntu distributions recommended, other distributions may work but are not supported)

**Technical Reasoning**: Node.js development tools, file system operations, and build processes work more reliably on Unix-like systems. Many npm packages, build tools, and file watchers have compatibility issues with native Windows environments.

### General Requirements

- Access to project codebase and repository
- Understanding of the project's technology stack
- Ability to run project locally on a supported platform
- Access to any external APIs or services used by the project

## Phase 1: Initial Project Analysis

### Step 1: Read and Analyze Existing Documentation

- Examine README.md, package.json, and any existing documentation files
- Identify project purpose, goals, and target audience
- Note any specific requirements, guidelines, or constraints
- Review existing build scripts and deployment configurations
- Identify gaps in current documentation

### Step 2: Technology Stack Discovery

- **Core Framework Analysis**: Identify main framework (React, Vue, Angular, etc.) and version
- **Package Manager**: Determine if project uses npm, yarn, or pnpm
- **Dependencies Audit**:
  - Extract all production and development dependencies from package.json
  - Verify actual versions match documentation
  - Identify key libraries and their purposes
- **Build Tools**: Identify bundlers, transpilers, and development tools
- **Testing Framework**: Document testing approach and tools
- **Deployment Platform**: Identify hosting and deployment strategy

### Step 3: Architecture and Codebase Analysis

- **Directory Structure Mapping**: Document all major directories and their purposes
- **Entry Points**: Identify main application entry points and configuration files
- **Routing Analysis**: Map out routing structure and page organization
- **Component Architecture**: Identify reusable components and their relationships
- **State Management**: Document state management patterns and tools
- **API Integration**: Identify external APIs, endpoints, and data flow
- **Database/CMS**: Document data storage and content management systems

## Phase 2: Comprehensive Documentation Creation

### Step 4: Create Master Documentation File

Create `PROJECT_DOCUMENTATION.md` with the following structure:

#### Required Sections:

1. **Project Overview**

   - Repository information and links
   - Project purpose, goals, and target audience
   - Key features and functionality
   - Project history and version information

2. **Technology Stack**

   - Core Framework (with exact versions)
   - UI Framework & Styling tools
   - Content Management systems
   - Build Tools & Development environment
   - Search & Utility libraries
   - Analytics & Monitoring tools
   - Deployment & Hosting platform

3. **Architecture Overview**

   - High-level architecture description
   - Data flow diagrams and patterns
   - Key design patterns and principles
   - Integration points and external dependencies

4. **Directory Structure**

   - Annotated tree view of project structure
   - Purpose of each major directory
   - Key configuration files and their roles
   - Generated vs. source file distinctions

5. **Key Components**

   - Layout components and their responsibilities
   - Content components and rendering logic
   - Page components and routing structure
   - Utility components and shared functionality
   - State management components

6. **API Documentation**

   - External API integrations and configurations
   - Endpoint documentation with request/response examples
   - Authentication and authorization patterns
   - Data processing workflows
   - Error handling strategies

7. **Database Schema** (if applicable)

   - Data models and relationships
   - Content structure and validation rules
   - Migration and seeding strategies

8. **Setup Instructions**

   - Prerequisites and system requirements
   - Step-by-step installation process
   - Environment configuration
   - Verification steps and troubleshooting

9. **Development Workflow**

   - Git workflow and branching strategy
   - Code standards and formatting rules
   - Testing approach and procedures
   - Common development tasks and procedures

10. **Build and Deployment**

    - Build process overview and scripts
    - Content generation workflows
    - Deployment configuration and process
    - Environment-specific considerations

11. **Configuration**

    - Environment variables and their purposes
    - Application configuration options
    - Build and deployment configurations
    - SEO and analytics setup

12. **Troubleshooting**

    - Common issues and solutions
    - Debug mode and logging strategies
    - Performance optimization tips
    - Maintenance tasks and schedules

13. **Node.js Development Guide for New Developers**
    - Node.js fundamentals and ecosystem overview
    - Platform-specific setup instructions (Windows/WSL2, macOS, Linux)
    - Essential command line skills
    - Development workflow best practices
    - Project-specific quick start guide
    - Useful tools and extensions

### Step 5: Package Manager Consistency Audit

- **Identify Primary Package Manager**: Determine project's preferred package manager
- **Documentation Consistency**: Ensure all commands use the same package manager
- **Script Verification**: Check all package.json scripts use consistent commands
- **Lock File Management**: Verify appropriate lock files are present and documented
- **Global vs Local Dependencies**: Document global tool requirements

## Phase 3: Automated Documentation Generation

### Step 6: Create HTML Documentation Generator

Create `creators/createDocumentationHTML.js` with the following features:

#### Core Functionality:

- Read PROJECT_DOCUMENTATION.md from project root
- Convert markdown to HTML using project's markdown parser configuration
- Generate complete HTML document with proper structure
- Apply responsive CSS styling matching project design
- Include syntax highlighting for code blocks
- Generate anchor IDs for headings and enable table of contents navigation

#### HTML Template Requirements:

- Proper DOCTYPE, html, head, and body structure
- Meta tags for charset, viewport, description, and robots
- Descriptive title tag
- Google Fonts integration (if used by project)
- Syntax highlighting CSS and JavaScript
- **Dark/Light Mode Toggle**: Fixed-position toggle button with theme persistence
- **CSS Variables**: Theme-aware color system for seamless mode switching
- **Accessibility**: Keyboard navigation and ARIA labels for theme toggle
- Responsive design with mobile breakpoints
- Print-friendly styles (forced light mode for printing)

#### Integration Requirements:

- Add script to package.json as individual command
- Integrate into main build process
- Include proper error handling and logging
- Output to `public/documentation/index.html`
- Follow project's coding standards and patterns

### Step 7: SEO and Access Control Configuration

Create `public/robots.txt` with:

- Allow general web crawling: `User-agent: *` and `Allow: /`
- Disallow documentation directory: `Disallow: /documentation/`
- Include sitemap reference if applicable
- Add any project-specific crawling rules

### Step 8: Build Process Integration

- Add documentation generation to main build scripts
- Ensure proper execution order in build pipeline
- Test integration with development and production builds
- Verify documentation updates automatically with content changes

## Phase 4: Quality Assurance and Validation

### Step 9: Content Completeness Verification

- **Section Completeness**: Verify all 13 required sections are present
- **Subsection Coverage**: Ensure all subsections and details are included
- **Code Block Preservation**: Verify all code examples are properly formatted
- **Link Functionality**: Test all internal and external links
- **Table and List Formatting**: Confirm proper rendering of structured content

### Step 10: Technical Accuracy Validation

- **Version Number Verification**: Cross-reference all version numbers with package.json
- **File Path Accuracy**: Verify all mentioned files and directories exist
- **Command Syntax**: Test all provided commands for accuracy
- **Environment Variable Validation**: Confirm all environment variables are correctly documented
- **API Endpoint Verification**: Test documented API endpoints and configurations

### Step 11: HTML Documentation Testing

- **Generation Testing**: Verify `yarn create:documentation` works correctly
- **File Output**: Confirm HTML file is created in correct location with appropriate size
- **Browser Rendering**: Test HTML file opens and renders correctly in browsers
- **Navigation Functionality**: Verify table of contents links work with smooth scrolling
- **Responsive Design**: Test documentation on various screen sizes
- **Syntax Highlighting**: Confirm code blocks have proper syntax highlighting

### Step 12: Build Integration Validation

- **Individual Script Execution**: Test documentation generation script independently
- **Main Build Process**: Verify integration with primary build commands
- **Execution Order**: Confirm script runs in correct sequence
- **Error Handling**: Test behavior when source files are missing or malformed
- **Performance**: Verify generation time is reasonable

## Phase 5: Developer Experience Enhancement

### Step 13: Platform-Specific Setup Documentation

⚠️ **CRITICAL**: Windows users MUST use WSL2. Native Windows development is not supported.

#### **Windows with WSL2 (MANDATORY for Windows Users)**

**Why WSL2 is Required:**

- Native Windows lacks proper Unix-like file system operations
- Many Node.js packages have native dependencies that don't compile on Windows
- File watchers and build tools perform poorly on Windows file systems
- Path resolution and symlink handling differ significantly from Unix systems

**Complete WSL2 Setup Process:**

- WSL2 installation and Ubuntu distribution setup
- Node.js and development environment configuration within WSL2
- VS Code integration with WSL2 extension
- File system best practices (store projects in WSL2 file system, not Windows)
- Performance optimization tips

#### **macOS (Fully Supported)**

- Homebrew-based setup with shell configuration
- Native Unix-like environment provides excellent compatibility
- Apple Silicon M1/M2/M3/M4 processors offer superior performance for Node.js development
- Intel Macs supported but may have slower build times

#### **Linux (Fully Supported)**

- Native installation methods with package manager considerations
- Debian/Ubuntu distributions recommended and fully tested
- Other distributions (Fedora, Arch, etc.) may work but are not officially supported
- Excellent performance and compatibility for all Node.js development tasks

#### **Unsupported Platforms**

- **Native Windows (Command Prompt/PowerShell)**: Not supported, will cause build failures
- **Windows Git Bash**: Not supported, lacks proper Unix environment
- **Windows with Node.js directly installed**: Not supported, compatibility issues guaranteed

### Step 14: Comprehensive Troubleshooting Guide

#### **Platform-Specific Issues**

**Windows Users Attempting Native Development (Common Mistakes):**

- **Error**: `ENOENT: no such file or directory, scandir` → **Solution**: Use WSL2, not native Windows
- **Error**: `gyp ERR! stack Error: Can't find Python executable` → **Solution**: Use WSL2 with proper Linux environment
- **Error**: File watchers not working or extremely slow → **Solution**: Use WSL2 file system, not Windows file system
- **Error**: `EPERM: operation not permitted` on file operations → **Solution**: Use WSL2 with proper Unix permissions
- **Error**: Build scripts failing with path resolution errors → **Solution**: Use WSL2 for proper Unix path handling

**WSL2-Specific Issues:**

- **Performance**: Store projects in WSL2 file system (`/home/username/`) not Windows file system (`/mnt/c/`)
- **VS Code Integration**: Install "Remote - WSL" extension for proper development environment
- **Memory Issues**: Configure WSL2 memory limits in `.wslconfig` file
- **Network Issues**: Use WSL2 IP address for local development server access

#### **General Development Issues**

- **Build Failures**: Common build errors and solutions
- **Development Server Issues**: Port conflicts, hot reload problems
- **Content Display Issues**: Missing content, broken images, search problems
- **Deployment Issues**: Build failures, 404 errors, performance problems
- **Debug Strategies**: Logging, environment checking, dependency verification

### Step 15: Tools and Extensions Documentation

- **IDE Extensions**: Recommended extensions for the project's technology stack
- **Browser Tools**: Developer tools tips and debugging strategies
- **Command Line Utilities**: Helpful global tools and their usage
- **Performance Monitoring**: Tools and techniques for optimization

## Deliverables Checklist

### Required Files:

- [ ] `PROJECT_DOCUMENTATION.md` - Complete project documentation
- [ ] `creators/createDocumentationHTML.js` - HTML generation script
- [ ] `public/robots.txt` - SEO and access control configuration
- [ ] Updated `package.json` - New scripts and dependencies
- [ ] `public/documentation/index.html` - Generated HTML documentation

### Quality Metrics:

- [ ] All 13 documentation sections complete and accurate
- [ ] 100% package manager consistency throughout documentation
- [ ] All version numbers verified against actual dependencies
- [ ] All file paths and commands tested and validated
- [ ] HTML documentation generates successfully and renders properly
- [ ] Table of contents navigation fully functional
- [ ] Responsive design works on mobile and desktop
- [ ] Build process integration successful
- [ ] Comprehensive troubleshooting coverage

### Validation Criteria:

- [ ] New developers can successfully set up project using documentation
- [ ] All commands execute without errors
- [ ] Documentation automatically updates with build process
- [ ] HTML version provides professional presentation for internal use
- [ ] Platform-specific instructions work for Windows, macOS, and Linux
- [ ] Troubleshooting guide addresses real-world scenarios

## Success Indicators

1. **Platform Compatibility**: Clear warnings prevent Windows users from attempting unsupported native development
2. **Completeness**: Documentation covers all aspects of project setup, development, and deployment
3. **Accuracy**: All technical information is current and verified
4. **Usability**: New team members can onboard successfully using the documentation on supported platforms
5. **Maintainability**: Documentation updates automatically with project changes
6. **Professional Presentation**: HTML version suitable for stakeholder review
7. **Developer Experience**: Comprehensive guidance for developers of all experience levels
8. **Platform Support**: WSL2, macOS, and Linux users can follow setup instructions without compatibility issues

This framework ensures consistent, professional documentation that serves both as a reference and an onboarding tool, while providing automated generation and maintenance workflows.

## Implementation Templates

### createDocumentationHTML.js Template

```javascript
/**
 * Documentation HTML Generator
 * Converts PROJECT_DOCUMENTATION.md to professional HTML documentation
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItAnchor = require("markdown-it-anchor");

// Initialize markdown parser with project configuration
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
})
  .use(markdownItAnchor, {
    level: [1, 2, 3, 4, 5, 6],
    permalink: false,
  })
  .use(markdownItAttrs, {
    allowedAttributes: ["id", "class", "style", "target", "rel"],
  });

/**
 * Generate HTML template with proper structure and styling
 */
function generateHTMLTemplate(content, projectName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Comprehensive project documentation for ${projectName}">
    <meta name="robots" content="noindex, nofollow">
    <title>${projectName} - Project Documentation</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,400;0,700;0,900;1,100&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100&family=Raleway:ital,wght@0,100;0,400;0,900;1,100&display=swap" rel="stylesheet">

    <!-- Syntax highlighting -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">

    <style>
        /* CSS Variables for theme management */
        :root {
            --bg-primary: #f8f9fa;
            --bg-secondary: #ffffff;
            --text-primary: #333333;
            --text-secondary: #666666;
            --border-color: #e0e0e0;
            --accent-primary: #1976d2;
            --accent-secondary: #1565c0;
            --code-bg: #2d3748;
            --code-text: #e2e8f0;
            --shadow: rgba(0,0,0,0.1);
            --toggle-bg: #ccc;
            --toggle-thumb: #fff;
        }

        [data-theme="dark"] {
            --bg-primary: #1a1a1a;
            --bg-secondary: #2d2d2d;
            --text-primary: #e0e0e0;
            --text-secondary: #b0b0b0;
            --border-color: #404040;
            --accent-primary: #64b5f6;
            --accent-secondary: #42a5f5;
            --code-bg: #1e1e1e;
            --code-text: #f0f0f0;
            --shadow: rgba(0,0,0,0.3);
            --toggle-bg: #555;
            --toggle-thumb: #fff;
        }

        /* Base styles */
        * {
            box-sizing: border-box;
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        body {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: var(--bg-primary);
        }

        .documentation-container {
            background: var(--bg-secondary);
            border-radius: 8px;
            box-shadow: 0 2px 10px var(--shadow);
            padding: 40px;
            margin: 20px 0;
            position: relative;
        }

        /* Theme toggle button */
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: var(--bg-secondary);
            border: 2px solid var(--border-color);
            border-radius: 25px;
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--text-primary);
            box-shadow: 0 2px 8px var(--shadow);
            transition: all 0.3s ease;
        }

        .theme-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px var(--shadow);
        }

        .theme-toggle:focus {
            outline: 2px solid var(--accent-primary);
            outline-offset: 2px;
        }

        .toggle-switch {
            position: relative;
            width: 40px;
            height: 20px;
            background: var(--toggle-bg);
            border-radius: 20px;
            transition: background-color 0.3s ease;
        }

        .toggle-thumb {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background: var(--toggle-thumb);
            border-radius: 50%;
            transition: transform 0.3s ease;
        }

        [data-theme="dark"] .toggle-thumb {
            transform: translateX(20px);
        }

        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Lato', sans-serif;
            font-weight: 700;
            margin-top: 2em;
            margin-bottom: 1em;
            line-height: 1.2;
            color: var(--text-primary);
        }

        h1 {
            color: var(--accent-primary);
            border-bottom: 3px solid var(--accent-primary);
            padding-bottom: 10px;
            font-size: 2.5em;
            margin-top: 0;
        }

        h2 {
            color: var(--accent-secondary);
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 8px;
            font-size: 2em;
        }

        h3 {
            color: var(--accent-secondary);
            font-size: 1.5em;
        }

        h4 {
            color: var(--text-primary);
            font-size: 1.25em;
        }

        /* Links */
        a {
            color: var(--accent-primary);
            text-decoration: none;
            transition: color 0.3s ease;
        }

        a:hover {
            text-decoration: underline;
            color: var(--accent-secondary);
        }

        /* Code blocks */
        code {
            background-color: var(--border-color);
            color: var(--text-primary);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 0.9em;
        }

        pre {
            background-color: var(--code-bg);
            color: var(--code-text);
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
            border: 1px solid var(--border-color);
        }

        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: var(--bg-secondary);
        }

        th, td {
            border: 1px solid var(--border-color);
            padding: 12px;
            text-align: left;
        }

        th {
            background-color: var(--border-color);
            font-weight: 600;
            color: var(--text-primary);
        }

        /* Lists */
        ul, ol {
            padding-left: 30px;
        }

        li {
            margin-bottom: 8px;
            color: var(--text-primary);
        }

        /* Blockquotes */
        blockquote {
            border-left: 4px solid var(--accent-primary);
            margin: 20px 0;
            padding: 10px 20px;
            background-color: var(--border-color);
            font-style: italic;
            color: var(--text-secondary);
        }

        /* Horizontal rules */
        hr {
            border: none;
            height: 1px;
            background-color: var(--border-color);
            margin: 2em 0;
        }

        /* Responsive design */
        @media (max-width: 768px) {
            body { padding: 10px; }
            .documentation-container { padding: 20px; }
            h1 { font-size: 2em; }
            h2 { font-size: 1.5em; }
            .theme-toggle {
                top: 10px;
                right: 10px;
                padding: 6px 12px;
                font-size: 12px;
            }
        }

        /* Print styles */
        @media print {
            body {
                background: white !important;
                color: black !important;
            }
            .documentation-container {
                box-shadow: none !important;
                border: none !important;
                background: white !important;
            }
            .theme-toggle {
                display: none !important;
            }
            * {
                background: white !important;
                color: black !important;
            }
        }
    </style>
</head>
<body data-theme="dark">
    <!-- Theme toggle button -->
    <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle dark/light mode" tabindex="0">
        <span class="toggle-switch">
            <span class="toggle-thumb"></span>
        </span>
        <span class="toggle-label">Dark</span>
    </button>

    <div class="documentation-container">
        ${content}
    </div>

    <!-- Syntax highlighting -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>

    <!-- Theme management and navigation functionality -->
    <script>
        // Theme management
        function initializeTheme() {
            // Check for saved theme preference or default to dark mode
            const savedTheme = localStorage.getItem('documentation-theme') || 'dark';
            const body = document.body;
            const toggleLabel = document.querySelector('.toggle-label');

            body.setAttribute('data-theme', savedTheme);
            toggleLabel.textContent = savedTheme === 'dark' ? 'Dark' : 'Light';
        }

        function toggleTheme() {
            const body = document.body;
            const toggleLabel = document.querySelector('.toggle-label');
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            body.setAttribute('data-theme', newTheme);
            toggleLabel.textContent = newTheme === 'dark' ? 'Dark' : 'Light';

            // Save theme preference
            localStorage.setItem('documentation-theme', newTheme);
        }

        // Keyboard accessibility for theme toggle
        document.addEventListener('keydown', function(e) {
            if (e.target.classList.contains('theme-toggle') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                toggleTheme();
            }
        });

        document.addEventListener('DOMContentLoaded', function() {
            // Initialize theme
            initializeTheme();

            // Generate IDs for all headings
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(function(heading) {
                if (!heading.id) {
                    const text = heading.textContent || heading.innerText;
                    const id = text.toLowerCase()
                        .replace(/[^a-z0-9\\s-]/g, '')
                        .replace(/\\s+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                    heading.id = id;
                }
            });

            // Add smooth scrolling to anchor links
            const anchorLinks = document.querySelectorAll('a[href^="#"]');
            anchorLinks.forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        });
    </script>
</body>
</html>`;
}

async function createDocumentationHTML() {
  try {
    console.log("📖 Creating documentation HTML...");

    // Read the PROJECT_DOCUMENTATION.md file
    const markdownPath = path.join(process.cwd(), "PROJECT_DOCUMENTATION.md");

    if (!fs.existsSync(markdownPath)) {
      throw new Error(`PROJECT_DOCUMENTATION.md not found at ${markdownPath}`);
    }

    const markdownContent = fs.readFileSync(markdownPath, "utf8");
    console.log("✅ Read PROJECT_DOCUMENTATION.md successfully");

    // Convert markdown to HTML
    const htmlContent = md.render(markdownContent);
    console.log("✅ Converted markdown to HTML");

    // Get project name from package.json
    const packageJsonPath = path.join(process.cwd(), "package.json");
    let projectName = "Project";

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      projectName = packageJson.name || "Project";
    }

    // Generate complete HTML document
    const fullHTML = generateHTMLTemplate(htmlContent, projectName);

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), "public", "documentation");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write HTML file
    const outputPath = path.join(outputDir, "index.html");
    fs.writeFileSync(outputPath, fullHTML, "utf8");

    // Get file size for reporting
    const stats = fs.statSync(outputPath);
    const fileSizeKB = Math.round(stats.size / 1024);

    console.log(`✅ Documentation HTML created successfully at: ${outputPath}`);
    console.log(`📄 File size: ${fileSizeKB} KB`);
  } catch (error) {
    console.error("❌ Error creating documentation HTML:", error.message);
    process.exit(1);
  }
}

// Run the script
createDocumentationHTML();
```

### robots.txt Template

```
# Robots.txt for [PROJECT_NAME] website
# [PROJECT_URL]

# Allow all web crawlers to index all pages
User-agent: *
Allow: /

# Disallow documentation directory (internal use only)
Disallow: /documentation/

# Sitemap location (if applicable)
Sitemap: [PROJECT_URL]/sitemap.xml
```

### package.json Script Integration

Add to package.json scripts section:

```json
{
  "scripts": {
    "create:documentation": "node ./creators/createDocumentationHTML.js",
    "scripts": "yarn create:contentDirectory && yarn create:manualPages && yarn create:documentation && yarn create:pages && yarn create:searchIndex && yarn create:sitemap && yarn create:routes"
  }
}
```

## Advanced Implementation Notes

### Dependency Management

- Always use the project's existing markdown parser configuration
- Install `markdown-it-anchor` if not already present
- Ensure consistency with existing markdown processing pipeline
- Test with project's existing content structure

### Error Handling Best Practices

- Validate source file existence before processing
- Provide clear error messages with actionable solutions
- Include file size reporting for verification
- Log each step for debugging purposes

### Performance Considerations

- Optimize for large documentation files (>1000 lines)
- Implement efficient markdown parsing
- Minimize CSS and JavaScript payload
- Use CDN resources for external dependencies

### Maintenance Guidelines

- Update documentation generation with project changes
- Verify HTML output after dependency updates
- Test responsive design on multiple devices
- Validate accessibility compliance
- Test dark/light mode toggle functionality across browsers
- Verify theme persistence works correctly with localStorage

### Dark/Light Mode Features

The enhanced documentation generator includes:

- **Default Dark Mode**: Professional dark theme as default for better developer experience
- **Theme Toggle**: Fixed-position toggle button in top-right corner
- **Smooth Transitions**: CSS transitions for polished theme switching
- **Theme Persistence**: localStorage saves user preference across sessions
- **Accessibility**: Keyboard navigation (Enter/Space) and ARIA labels
- **Responsive Design**: Toggle button adapts to mobile screens
- **Print Optimization**: Automatically switches to light mode for printing
- **CSS Variables**: Complete theme system using CSS custom properties

This comprehensive framework provides everything needed to create professional, maintainable project documentation with automated HTML generation, seamless build integration, and modern dark/light mode functionality.
