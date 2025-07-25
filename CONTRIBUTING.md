
---

# Contributing to PesXChange

## How Can I Contribute?

### Reporting Bugs ➤

Report bugs for PesXChange by first checking existing issues to avoid duplicates. When submitting a report, provide clear and detailed information to help maintainers reproduce and resolve the issue.

---

### Suggesting Enhancements ➤

For enhancements (new features or improvements), check existing issues first. If already suggested, comment there instead of creating a new one.

---

### Pull Requests ➤

The process described here has several goals:

- Maintain PesXChange's quality
- Fix problems that are important to users

Please follow these steps to have your contribution considered by the maintainers:

1.  Follow all instructions in the template
2.  After you submit your pull request, verify that all status checks are passing

---

### Development Setup ➤

Ready to contribute? Here’s how to set up PesXChange for local development.

1.  **Fork the repository.**

2.  **Clone your fork:**
    ```sh
    git clone https://github.com/your-username/PesXChange
    ```

3.  **Install dependencies:**
    Navigate to the project directory and install the necessary dependencies.
    ```sh
    cd PesXChange
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add any required environment variables. You can use `.env.example` as a template.

5.  **Run the development server:**
    ```sh
    npm run dev
    ```

6.  **Create a new branch for your changes:**
    ```sh
    git checkout -b name-of-your-feature-or-fix
    ```

7.  **Make your changes, and commit them with a descriptive message along with screenshots.**

8.  **Push your changes to your fork and open a pull request!**

---

### Commit Messages

We use [Conventional Commits](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13) for our commit messages. This allows for easier tracking of changes and automated changelog generation.

For example:
- `feat: Add user profile page`
- `fix: Correct spelling in the main heading`
- `docs: Update CONTRIBUTING.md`

---