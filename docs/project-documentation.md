# ICJIA Public Client 2021 - Project Documentation

## Project Overview

### Repository Information

- **Repository**: [ICJIA/icjia-public-client-2021](https://github.com/ICJIA/icjia-public-client-2021)
- **Production URL**: [https://icjia.illinois.gov](https://icjia.illinois.gov)
- **Netlify Status**: [![Netlify Status](https://api.netlify.com/api/v1/badges/e6614e77-00b4-4772-8034-a3b9c9c9986d/deploy-status)](https://app.netlify.com/sites/icjia-public/deploys)
- **License**: MIT
- **Version**: 1.1.0

### Project Purpose and Goals

The ICJIA Public Client 2021 is the official front-end website for the Illinois Criminal Justice Information Authority (ICJIA). This Vue.js-based application serves as the primary digital presence for ICJIA, providing public access to:

- Criminal justice research and publications
- Grant funding opportunities and information
- News, meetings, and events
- Employment opportunities
- Authority information and staff biographies
- Research hub with articles, datasets, and applications

### Target Audience

- **Primary**: Criminal justice professionals, researchers, and policymakers in Illinois
- **Secondary**: General public interested in criminal justice information
- **Tertiary**: Grant applicants and job seekers

### Key Features and Functionality

- **Content Management**: Dynamic content delivery via GraphQL API integration
- **Search Functionality**: Full-site search powered by Fuse.js
- **Research Hub**: Dedicated section for research articles, datasets, and applications
- **Grant Management**: Comprehensive grant funding information and opportunities
- **Event Calendar**: Meetings, conferences, and training events
- **Publication Library**: Downloadable reports, studies, and documents
- **Employment Portal**: Job listings and career opportunities
- **Responsive Design**: Mobile-first approach with Vuetify UI framework
- **RSS Feeds**: Automated feed generation for news, funding, meetings, and employment
- **SEO Optimization**: Automated sitemap generation and meta tag management

### Project History and Version Information

- **Current Version**: 1.1.0 (2024)
- **Initial Release**: 2021
- **Development Status**: Active development and maintenance
- **Archive Date**: Content archived from January 1, 2021

## Technology Stack

### Core Framework

- **Vue.js**: 2.6.14 - Progressive JavaScript framework for building user interfaces
- **Vue Router**: 3.5.2 - Official router for Vue.js applications
- **Vuex**: 3.6.2 - State management pattern and library for Vue.js
- **Vue CLI**: 4.5.13 - Standard tooling for Vue.js development

### UI Framework & Styling

- **Vuetify**: 2.5.12 - Material Design component framework for Vue.js
- **Material Design Icons**: 6.1.0 - Icon library
- **AOS (Animate On Scroll)**: 3.0.0-beta.6 - Animation library
- **Sass**: 1.32.13 - CSS preprocessor
- **CSS**: Custom styling with responsive design principles

### Content Management & Data

- **GraphQL**: 15.6.0 - Query language for APIs
- **Apollo Client**: Vue Apollo 3.0.8 - GraphQL client with caching
- **Markdown-it**: 12.2.0 - Markdown parser with extensive plugin ecosystem
- **Axios**: 0.21.4 - HTTP client for REST API calls

### Build Tools & Development Environment

- **Webpack**: Via Vue CLI - Module bundler and build tool
- **Babel**: Via Vue CLI - JavaScript compiler
- **ESLint**: 7.32.0 - JavaScript linting utility
- **Prettier**: 2.4.0 - Code formatter
- **Node.js**: Runtime environment
- **npm**: Package manager

### Search & Utility Libraries

- **Fuse.js**: 6.4.6 - Fuzzy search library
- **Lodash**: 4.17.21 - Utility library
- **Moment.js**: 2.29.1 - Date manipulation library
- **DOMPurify**: 2.3.3 - HTML sanitization library

### Analytics & Monitoring

- **Google Analytics**: Via vue-gtag 1.16.1
- **Plausible Analytics**: Privacy-focused analytics
- **NProgress**: 0.2.0 - Progress bar library

### Deployment & Hosting

- **Netlify**: Primary hosting platform with CDN
- **Netlify Functions**: Serverless functions for API endpoints
- **Compression**: Brotli and Gzip compression enabled
- **Environment**: Production deployment with build optimization

## Architecture Overview

### High-Level Architecture

The ICJIA Public Client follows a modern JAMstack architecture pattern:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vue.js SPA    │◄──►│   GraphQL API    │◄──►│   Strapi CMS    │
│   (Frontend)    │    │   (Data Layer)   │    │   (Backend)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Netlify CDN   │    │  Search Index    │    │  File Storage   │
│   (Hosting)     │    │  (Fuse.js)       │    │  (Images/PDFs)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow Patterns

1. **Content Delivery**: Strapi CMS → GraphQL API → Vue Components → User Interface
2. **Search Flow**: Build Process → Search Index Generation → Fuse.js → Search Results
3. **Image Processing**: Strapi → Thumbor Image Service → Optimized Images → CDN
4. **Static Generation**: Build Process → RSS Feeds, Sitemap, Search Index → Static Files

### Key Design Patterns

- **Component-Based Architecture**: Reusable Vue components with clear separation of concerns
- **State Management**: Centralized state with Vuex for authentication and global data
- **API Integration**: Apollo Client for GraphQL queries with caching and error handling
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Mobile-First Design**: Responsive layouts optimized for mobile devices

### Integration Points and External Dependencies

- **ICJIA API**: `https://agency.icjia-api.cloud/graphql` - Primary content API
- **Research Hub API**: `https://researchhub.icjia-api.cloud/graphql` - Research content
- **Thumbor Image Service**: `https://image.icjia.cloud` - Image processing and optimization
- **Netlify Functions**: Serverless functions for search and other utilities
- **Google Analytics**: User behavior tracking and analytics
- **Plausible Analytics**: Privacy-focused analytics alternative

## Directory Structure

```
icjia-public-client-2021/
├── public/                          # Static assets and generated files
│   ├── api/                        # Generated JSON API files
│   ├── researchhub/                # Research hub static assets
│   ├── ie11/                       # IE11 compatibility page
│   ├── *.xml                       # RSS feeds (auto-generated)
│   ├── *.json                      # JSON feeds (auto-generated)
│   ├── sitemap.xml                 # Site map (auto-generated)
│   ├── searchIndex.json            # Search index (auto-generated)
│   └── robots.txt                  # SEO crawler instructions
├── src/                            # Source code
│   ├── components/                 # Vue components
│   │   ├── Hub/                   # Research hub components
│   │   ├── _globals.js            # Global component registration
│   │   └── *.vue                  # Reusable components
│   ├── views/                      # Page-level components
│   │   ├── About/                 # About section pages
│   │   ├── Home/                  # Homepage components
│   │   ├── Hub/                   # Research hub pages
│   │   ├── News/                  # News and information pages
│   │   └── *.vue                  # Other page components
│   ├── router/                     # Vue Router configuration
│   │   ├── index.js               # Main router setup
│   │   └── *.js                   # Route modules by section
│   ├── store/                      # Vuex state management
│   │   ├── modules/               # Store modules
│   │   └── index.js               # Store configuration
│   ├── services/                   # Business logic and utilities
│   │   ├── AppInit.js             # Application initialization
│   │   ├── Image.js               # Image processing utilities
│   │   ├── Markdown.js            # Markdown rendering
│   │   └── *.js                   # Other service modules
│   ├── graphql/                    # GraphQL queries and mutations
│   │   ├── home.js                # Homepage queries
│   │   ├── page.js                # Page queries
│   │   └── *.js                   # Feature-specific queries
│   ├── config/                     # Configuration files
│   │   ├── config.json            # Application configuration
│   │   ├── menus.json             # Navigation menus
│   │   └── *.json                 # Other configuration files
│   ├── assets/                     # Static assets (CSS, images)
│   ├── plugins/                    # Vue plugins configuration
│   ├── utils/                      # Utility functions
│   ├── filters.js                  # Vue filters
│   ├── main.js                     # Application entry point
│   └── App.vue                     # Root component
├── generators/                      # Build-time content generators
│   ├── generateRSS*.mjs           # RSS feed generators
│   ├── generateIndex*.js          # Search index generators
│   ├── searchIndexAndSitemap.js   # Search and sitemap generation
│   └── utils/                     # Generator utilities
├── lambda/                         # Netlify Functions
├── node_modules/                   # Dependencies (auto-generated)
├── package.json                    # Project dependencies and scripts
├── vue.config.js                   # Vue CLI configuration
├── netlify.toml                    # Netlify deployment configuration
├── babel.config.js                 # Babel configuration
├── .eslintrc.js                    # ESLint configuration
└── README.md                       # Basic project information
```

### Key Configuration Files

- **package.json**: Dependencies, scripts, and project metadata
- **vue.config.js**: Vue CLI and Webpack configuration
- **netlify.toml**: Netlify deployment and hosting configuration
- **src/config/config.json**: Application-wide configuration settings
- **apollo.config.js**: GraphQL client configuration
- **.eslintrc.js**: Code linting rules and standards

### Generated vs. Source Files

- **Generated Files**: `public/api/`, RSS feeds, sitemap.xml, searchIndex.json
- **Source Files**: Everything in `src/`, configuration files, generators
- **Build Output**: `dist/` directory (created during build process)

## Key Components

### Layout Components

- **AppNav.vue**: Main navigation bar with responsive menu system
- **AppFooter.vue**: Site footer with links and contact information
- **AppNavContext.vue**: Contextual navigation for different sections
- **Disclaimer.vue**: Legal disclaimers and notices

### Content Components

- **BaseContent.vue**: Base wrapper for content pages with loading states
- **PublicationCard.vue**: Display component for publications and documents
- **ClickthroughBoxes.vue**: Interactive content boxes for homepage
- **Toc.vue**: Table of contents generator for long-form content

### Page Components

- **Home.vue**: Homepage with dynamic content sections
- **AboutHome.vue**: About section landing page
- **News.vue**: News and information listing page
- **PublicationsAll.vue**: Complete publications library

### Utility Components

- **ModalSearch.vue**: Site-wide search modal with Fuse.js integration
- **ModalTranslate.vue**: Translation modal (placeholder for future feature)
- **HomeSplashV2.vue**: Homepage hero section with carousel

### State Management Components

- **store/modules/auth.js**: Authentication state management
- **services/AppInit.js**: Application initialization and global state setup

## API Documentation

### GraphQL Endpoints

#### Primary API: ICJIA Agency API

- **Base URL**: `https://agency.icjia-api.cloud/graphql`
- **Purpose**: Main content management for pages, news, grants, meetings, employment
- **Authentication**: JWT-based for admin functions

#### Research Hub API

- **Base URL**: `https://researchhub.icjia-api.cloud/graphql`
- **Purpose**: Research articles, datasets, and applications
- **Authentication**: Public read access

### Key Query Examples

#### Homepage Content

```graphql
query Home(
  $postLimit: Int!
  $meetingLimit: Int!
  $fundingLimit: Int!
  $employmentLimit: Int!
) {
  home {
    homeBanner {
      bannerText
      bannerColor
      whiteText
      dismissable
    }
    homeCarousel {
      title
      slide {
        title
        teaser
        image {
          url
          formats
        }
      }
    }
    clickThroughBoxes {
      title
      url
      teaser
      icon
    }
  }
}
```

#### Page Content

```graphql
query page($slug: String!) {
  pages(where: { slug: $slug }) {
    title
    body
    summary
    showTOC
    attachments {
      name
      url
      size
    }
    tags {
      title
      slug
    }
  }
}
```

### Authentication and Authorization

- **JWT Tokens**: Stored in localStorage for admin authentication
- **Public Access**: Most content is publicly accessible
- **Admin Functions**: Login required for content management
- **API Timeout**: 15 seconds for all API requests

### Data Processing Workflows

1. **Content Fetching**: Apollo Client queries with caching
2. **Image Processing**: Thumbor service for optimization and resizing
3. **Search Indexing**: Build-time generation of searchable content
4. **RSS Generation**: Automated feed creation for different content types

### Error Handling Strategies

- **GraphQL Errors**: Captured and displayed to users
- **Network Errors**: Retry logic and fallback messaging
- **Loading States**: Progress indicators during data fetching
- **404 Handling**: Automatic redirect to 404 page for missing content

## Setup Instructions

### Prerequisites and System Requirements

⚠️ **IMPORTANT PLATFORM COMPATIBILITY WARNING** ⚠️

This project is **NOT compatible with vanilla Windows** (native Windows without WSL2). Development requires one of these supported platforms:

1. **Windows with WSL2** (Windows Subsystem for Linux 2) - **REQUIRED** for Windows users
2. **macOS** (Apple Silicon M1/M2/M3/M4 preferred over Intel for better performance)
3. **Linux** (Debian/Ubuntu distributions recommended)

**Technical Reasoning**: Node.js development tools, file system operations, and build processes work more reliably on Unix-like systems. Many npm packages, build tools, and file watchers have compatibility issues with native Windows environments.

### Required Software

- **Node.js**: Version 14.x or higher
- **npm**: Version 6.x or higher (comes with Node.js)
- **Git**: For version control

### Step-by-Step Installation Process

#### 1. Clone the Repository

```bash
git clone https://github.com/ICJIA/icjia-public-client-2021.git
cd icjia-public-client-2021
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Configuration

Copy the sample environment file and configure:

```bash
cp .env.sample .env
```

Edit `.env` file with required values:

```env
VUE_APP_THUMBOR_KEY=your_thumbor_key_here
PLAUSIBLE_API_KEY=your_plausible_key_here
PLAUSIBLE_API_DOMAIN=icjia.illinois.gov
PLAUSIBLE_API_BASE=hhttps://plausible.icjia.cloud/
```

#### 4. Generate Required Files

```bash
npm run scripts
```

This command runs:

- Schema generation from GraphQL endpoint
- Search index generation
- RSS feed generation

### Verification Steps

1. **Development Server**: `npm run serve` - Should start on http://localhost:8080
2. **Build Process**: `npm run build` - Should complete without errors
3. **Linting**: `npm run lint` - Should pass all checks

### Troubleshooting Common Issues

- **Port 8080 in use**: The serve script automatically kills processes on port 8080
- **API Connection**: Ensure internet connection for GraphQL schema generation
- **Memory Issues**: Increase Node.js memory limit if needed: `--max-old-space-size=4096`

## Development Workflow

### Git Workflow and Branching Strategy

- **Main Branch**: `main` - Production-ready code
- **Feature Branches**: `feature/feature-name` - New features and improvements
- **Hotfix Branches**: `hotfix/issue-description` - Critical bug fixes
- **Pull Requests**: Required for all changes to main branch

### Code Standards and Formatting

- **ESLint**: Enforces JavaScript code quality and consistency
- **Prettier**: Automatic code formatting
- **Vue Style Guide**: Follows official Vue.js style recommendations
- **Commit Messages**: Conventional commit format preferred

### Testing Approach

- **Manual Testing**: Comprehensive testing across different devices and browsers
- **Build Testing**: Automated build verification
- **API Testing**: GraphQL query validation
- **Performance Testing**: Lighthouse audits for performance optimization

### Common Development Tasks

#### Starting Development Server

```bash
npm run serve
```

- Starts development server with hot reload
- Automatically generates required files
- Kills any existing processes on port 8080

#### Building for Production

```bash
npm run build
```

- Generates optimized production build
- Creates compressed assets (Brotli and Gzip)
- Builds Netlify Functions
- Generates build information banner

#### Content Generation

```bash
npm run scripts
```

- Updates GraphQL schema
- Regenerates search index
- Creates RSS feeds
- Updates sitemap

#### Code Quality

```bash
npm run lint          # Check code quality
npm run lint --fix    # Auto-fix linting issues
```

### Development Best Practices

1. **Component Structure**: Keep components focused and reusable
2. **State Management**: Use Vuex for global state, local state for component-specific data
3. **API Calls**: Use Apollo Client for GraphQL, Axios for REST
4. **Error Handling**: Always handle loading and error states
5. **Performance**: Lazy load routes and components where appropriate
6. **Accessibility**: Follow WCAG guidelines for accessibility compliance

## Build and Deployment

### Build Process Overview

The build process is automated through npm scripts and includes multiple stages:

1. **Pre-build**: Image generation and content indexing
2. **Main Build**: Vue CLI compilation and optimization
3. **Post-build**: Lambda function building and build info generation

### Build Scripts Breakdown

#### Complete Build Process

```bash
npm run build
```

Executes in sequence:

1. `npm run generate:images` - Generates optimized images for Research Hub
2. `npm run scripts` - Runs all content generation scripts
3. `vue-cli-service build` - Compiles and optimizes the Vue application
4. `npm run build:lambda` - Builds Netlify Functions
5. `npm run postbuild` - Adds build information to index.html

#### Content Generation Workflow

```bash
npm run scripts
```

Executes:

1. `npm run generate:schema` - Downloads GraphQL schema
2. `npm run generate:search` - Creates search indexes for all content types
3. `npm run generate:feeds` - Generates RSS/Atom/JSON feeds

#### Individual Generation Scripts

- **Search Indexes**: `generateIndex*.js` files create searchable content
- **RSS Feeds**: `generateRSS*.mjs` files create syndication feeds
- **Sitemap**: `searchIndexAndSitemap.js` creates XML sitemap

### Deployment Configuration

#### Netlify Configuration (`netlify.toml`)

```toml
[build]
  Command = "npm run build"
  functions = "lambda"
  Publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
```

#### Environment-Specific Considerations

- **Production**: Optimized builds with compression and minification
- **Development**: Hot reload and source maps enabled
- **Staging**: Same as production but with different API endpoints

### Deployment Process

1. **Automatic Deployment**: Triggered by pushes to main branch
2. **Build Verification**: Netlify runs build process in cloud environment
3. **Function Deployment**: Lambda functions deployed to Netlify edge
4. **CDN Distribution**: Static assets distributed globally
5. **DNS Updates**: Automatic SSL and domain management

## Configuration

### Environment Variables

Required environment variables for full functionality:

```env
# Image Processing
VUE_APP_THUMBOR_KEY=secret_key_for_image_service

# Analytics
PLAUSIBLE_API_KEY=analytics_api_key
PLAUSIBLE_API_DOMAIN=icjia.illinois.gov
PLAUSIBLE_API_BASE=hhttps://plausible.icjia.cloud/
# Apollo GraphQL (optional for development)
VUE_APP_APOLLO_ENGINE_SERVICE=service_name
VUE_APP_APOLLO_ENGINE_KEY=engine_api_key
```

### Application Configuration (`src/config/config.json`)

Key configuration sections:

#### API Endpoints

```json
{
  "api": {
    "base": "https://agency.icjia-api.cloud",
    "baseGraphQL": "https://agency.icjia-api.cloud/graphql",
    "baseClient": "https://icjia.illinois.gov",
    "timeout": 15000
  }
}
```

#### Content Limits

```json
{
  "home": {
    "eventLimit": 3,
    "postLimit": 5,
    "fundingLimit": 5,
    "meetingLimit": 5,
    "employmentLimit": 3
  }
}
```

#### Image Processing

```json
{
  "image": {
    "server": "https://image.icjia.cloud",
    "thumbHeight": 100,
    "thumbWidth": 0,
    "splashHeight": 400,
    "splashWidth": 0
  }
}
```

### Build Configuration (`vue.config.js`)

- **Compression**: Brotli and Gzip compression enabled
- **Proxy**: Development proxy for Netlify Functions
- **Transpilation**: Vuetify, nanoid, and Fuse.js transpiled for compatibility
- **Webpack Plugins**: Compression plugin for optimized assets

### SEO and Analytics Setup

- **Google Analytics**: Configured via vue-gtag plugin
- **Plausible Analytics**: Privacy-focused alternative analytics
- **Meta Tags**: Dynamic meta tag generation via vue-meta
- **Sitemap**: Automatically generated XML sitemap
- **RSS Feeds**: Multiple feed formats (RSS 2.0, Atom, JSON)

## Troubleshooting

### Common Issues and Solutions

#### Platform-Specific Issues

**Windows Users Attempting Native Development (Common Mistakes):**

- **Error**: `ENOENT: no such file or directory, scandir` → **Solution**: Use WSL2, not native Windows
- **Error**: `gyp ERR! stack Error: Can't find Python executable` → **Solution**: Use WSL2 with proper Linux environment
- **Error**: File watchers not working or extremely slow → **Solution**: Use WSL2 file system, not Windows file system
- **Error**: `EPERM: operation not permitted` on file operations → **Solution**: Use WSL2 with proper Unix permissions
- **Error**: Build scripts failing with path resolution errors → **Solution**: Use WSL2 for proper Unix path handling

#### WSL2-Specific Issues

- **Performance**: Store projects in WSL2 file system (`/home/username/`) not Windows file system (`/mnt/c/`)
- **VS Code Integration**: Install "Remote - WSL" extension for proper development environment
- **Memory Issues**: Configure WSL2 memory limits in `.wslconfig` file
- **Network Issues**: Use WSL2 IP address for local development server access

#### Build Failures

- **Memory Issues**: Increase Node.js memory limit: `node --max-old-space-size=4096`
- **API Timeouts**: Check internet connection and API endpoint availability
- **Missing Dependencies**: Run `npm install` to ensure all packages are installed
- **Port Conflicts**: The serve script automatically handles port 8080 conflicts

#### Development Server Issues

- **Hot Reload Not Working**: Ensure file watchers are properly configured
- **API Connection Errors**: Verify GraphQL endpoints are accessible
- **Proxy Issues**: Check vue.config.js proxy configuration for Netlify Functions

#### Content Display Issues

- **Missing Images**: Verify Thumbor service configuration and API keys
- **Search Not Working**: Ensure search index generation completed successfully
- **Broken Links**: Check that all content exists in the CMS

#### Deployment Issues

- **Build Failures on Netlify**: Check build logs for specific error messages
- **404 Errors**: Verify routing configuration and redirects
- **Performance Problems**: Run Lighthouse audits and optimize accordingly

### Debug Strategies

1. **Console Logging**: Use browser developer tools to check for JavaScript errors
2. **Network Tab**: Monitor API requests and responses
3. **Vue DevTools**: Install Vue DevTools browser extension for component debugging
4. **Build Logs**: Check Netlify build logs for deployment issues
5. **Environment Checking**: Verify all environment variables are properly set

### Performance Optimization Tips

- **Image Optimization**: Use appropriate image sizes and formats
- **Code Splitting**: Implement lazy loading for routes and components
- **Caching**: Leverage Apollo Client caching for GraphQL queries
- **Compression**: Ensure Brotli/Gzip compression is working
- **CDN**: Utilize Netlify's global CDN for static assets

### Maintenance Tasks and Schedules

- **Weekly**: Review and update dependencies with security patches
- **Monthly**: Performance audits and optimization reviews
- **Quarterly**: Comprehensive security reviews and updates
- **As Needed**: Content updates and feature additions

## Node.js Development Guide for New Developers

### Node.js Fundamentals and Ecosystem Overview

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine that allows you to run JavaScript on the server side. Key concepts:

- **npm (Node Package Manager)**: Manages project dependencies and scripts
- **package.json**: Project configuration file listing dependencies and scripts
- **node_modules**: Directory containing all installed packages
- **Event Loop**: Non-blocking I/O model that makes Node.js efficient

### Platform-Specific Setup Instructions

#### Windows with WSL2 (MANDATORY for Windows Users)

**Why WSL2 is Required:**

- Native Windows lacks proper Unix-like file system operations
- Many Node.js packages have native dependencies that don't compile on Windows
- File watchers and build tools perform poorly on Windows file systems
- Path resolution and symlink handling differ significantly from Unix systems

**Complete WSL2 Setup Process:**

1. **Install WSL2**:
   ```powershell
   wsl --install
   ```
2. **Install Ubuntu distribution**:
   ```powershell
   wsl --install -d Ubuntu
   ```
3. **Install Node.js in WSL2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. **Configure VS Code**:
   - Install "Remote - WSL" extension
   - Open project in WSL2: `code .` from WSL2 terminal

#### macOS (Fully Supported)

**Homebrew-based setup:**

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

#### Linux (Fully Supported)

**Ubuntu/Debian:**

```bash
# Update package index
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Essential Command Line Skills

- **Navigation**: `cd`, `ls`, `pwd`
- **File Operations**: `mkdir`, `rm`, `cp`, `mv`
- **Package Management**: `npm install`, `npm run`, `npm update`
- **Git Operations**: `git clone`, `git add`, `git commit`, `git push`

### Development Workflow Best Practices

1. **Always use package managers** for dependency management
2. **Keep dependencies updated** regularly for security
3. **Use version control** for all code changes
4. **Test locally** before deploying
5. **Follow coding standards** and use linting tools

### Project-Specific Quick Start Guide

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment**: Copy and configure `.env` file
4. **Generate content**: `npm run scripts`
5. **Start development**: `npm run serve`

### Useful Tools and Extensions

- **VS Code Extensions**: Vue Language Features, ESLint, Prettier
- **Browser Tools**: Vue DevTools, React DevTools
- **Command Line**: Git, curl, wget
- **Package Management**: npm, yarn (alternative to npm)

## Contributing Guidelines

### Code Contribution Process

1. **Fork the Repository**: Create a personal fork of the project
2. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Make Changes**: Implement your feature or bug fix
4. **Test Thoroughly**: Ensure all functionality works as expected
5. **Commit Changes**: Use conventional commit messages
6. **Push to Fork**: `git push origin feature/your-feature-name`
7. **Create Pull Request**: Submit PR with detailed description

### Code Standards

- **ESLint Configuration**: Follow the project's ESLint rules
- **Vue Style Guide**: Adhere to official Vue.js style recommendations
- **Component Naming**: Use PascalCase for component names
- **File Organization**: Keep related files grouped logically
- **Documentation**: Comment complex logic and provide JSDoc for functions

### Pull Request Guidelines

- **Clear Description**: Explain what changes were made and why
- **Testing**: Include information about testing performed
- **Screenshots**: Provide before/after screenshots for UI changes
- **Breaking Changes**: Clearly document any breaking changes
- **Dependencies**: List any new dependencies added

### Issue Reporting

- **Bug Reports**: Use the bug report template with reproduction steps
- **Feature Requests**: Clearly describe the proposed functionality
- **Security Issues**: Report security vulnerabilities privately
- **Documentation**: Suggest improvements to documentation

### Development Environment Setup for Contributors

1. **Follow Setup Instructions**: Complete the setup process outlined above
2. **Install Git Hooks**: Set up pre-commit hooks for code quality
3. **Configure IDE**: Install recommended extensions and settings
4. **Test Build Process**: Ensure you can build the project successfully

### Review Process

- **Code Review**: All PRs require review from project maintainers
- **Automated Checks**: CI/CD pipeline must pass all checks
- **Testing**: Manual testing may be required for UI changes
- **Documentation**: Updates to documentation may be requested

---

## Project Maintenance and Support

### Current Maintainers

- **Illinois Criminal Justice Information Authority (ICJIA)**
- **Email**: cja.info@illinois.gov
- **Repository**: [ICJIA/icjia-public-client-2021](https://github.com/ICJIA/icjia-public-client-2021)

### Support Channels

- **GitHub Issues**: For bug reports and feature requests
- **Security Policy**: See [SECURITY.md](SECURITY.md) for vulnerability reporting
- **Documentation**: This document and inline code comments

### License and Legal

- **License**: MIT License
- **Copyright**: Illinois Criminal Justice Information Authority
- **Terms**: See LICENSE file for full terms and conditions

### Version History

- **v1.1.0**: Current version with enhanced features and performance improvements
- **v1.0.0**: Initial release with core functionality
- **Development**: Ongoing active development and maintenance

This documentation provides comprehensive guidance for developers working with the ICJIA Public Client 2021 project. For additional questions or clarification, please refer to the project repository or contact the maintainers.
