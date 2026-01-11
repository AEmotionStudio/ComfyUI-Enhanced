# Contributing to ComfyUI Enhanced Links and Nodes

First off, thank you for considering contributing to ComfyUI Enhanced Links and Nodes! Your help is greatly appreciated.

## How Can I Contribute?

There are many ways to contribute, from reporting bugs to suggesting new features or submitting pull requests.

### Reporting Bugs

If you encounter a bug, please open an issue on our [GitHub issue tracker](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/issues). Please include the following information:

- A clear and descriptive title.
- A detailed description of the bug, including steps to reproduce it.
- Your ComfyUI version and browser information.
- Any relevant screenshots or error messages.

### Pull Requests

We welcome pull requests!

1. Fork the repository.
2. Create a new branch for your changes (`git checkout -b feature/your-feature-name`).
3. Make your changes and commit them with a clear and descriptive commit message.
4. Push your changes to your fork (`git push origin feature/your-feature-name`).
5. Open a pull request to the `main` branch of this repository.

## Development Setup

The project currently uses **JavaScript**. We plan to migrate to TypeScript in the future, but for now, we edit the JavaScript files directly.

### Prerequisites

- A working installation of [ComfyUI](https://github.com/comfyanonymous/ComfyUI).

### Setup Instructions

1.  Clone the repository into your `ComfyUI/custom_nodes` folder:
    ```bash
    cd ComfyUI/custom_nodes/
    git clone https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes.git
    ```

### Workflow

Since this is a standard ComfyUI extension using vanilla JavaScript:

1.  Edit the files in the `js/` directory.
2.  Refresh your browser window to see changes in ComfyUI.
    *   *Note: If you make changes to `__init__.py`, you will need to restart the ComfyUI server.*

## Project Structure

- **`js/`**: Contains the client-side JavaScript source code.
    - `link_animations.js`: Logic for link styles and animations.
    - `node_animations.js`: Logic for node effects and text animations.
- **`__init__.py`**: ComfyUI entry point (Python).

## Code Style

- Write clean, readable JavaScript.
- Document new features in the code and update the README if necessary.

Thank you for your contributions!
