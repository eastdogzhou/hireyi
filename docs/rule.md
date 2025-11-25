# Development Guidelines

If you are about to make changes to the codebase, please follow these guidelines to ensure a smooth development process. This file is a guideline to the project for both Coding Agent (Assistant) and human developers.

This guideline uses RFC 2119 for key words such as MUST, SHOULD, and MAY, so please pay attention to these terms as they indicate the level of importance for each requirement.

## Development Tools

This project is a Python backend project, it uses:

- **[`uv`](https://github.com/astral-sh/uv)** For dependency resolution, virtual environments, packaging and publishing.
- **[`pytest`](https://pytest.org/)** For unit testing.
- **[`ruff`](https://github.com/astral-sh/ruff)** For linting and code formatting.
- **[`basedpyright`](https://github.com/DetachHead/basedpyright)** For static type checking.
- **[`pre-commit`](https://pre-commit.com/)** For running commit hooks, typically formatting and linting.


The front end of this project is a modern Web applications, it uses following rules as consititution:

- 采用 Domain-Driven Design
- 技术栈:TypeScript + React + TailwindCSS
- 遵循 TDD 原则
- 必须符合 WCAG 2.1 AA 无障碍标准
- API 优先设计
- 所有组件必须有 Storybook 文档


## Development Setup

### Pre-requisites
You **MUST** have [git](https://git-scm.com/) and [uv](https://github.com/astral-sh/uv) installed.

> You can install uv via `curl -LsSf https://astral.sh/uv/install.sh | sh`.


### Setup Environment
Then run:

```bash
uv sync
```

and:

```bash
pre-commit install
```

That's all! You are ready to code!

> Here are some useful uv commands:
> - `uv add <package>`: Add a new package. For dev tools, use `uv add --dev <package>`
> - `uv remove <package>`: Remove an existing package.
> - `uv build && uv publish`: Build and publish the project.

## Testing

### Test Framework
- All tests **MUST** be written using `pytest`.
- Test files **MUST** follow the naming convention `test_*.py` or `*_test.py`.
- Test functions **MUST** be prefixed with `test_`.

### Test Coverage
- New features **MUST** include comprehensive unit tests.
- Bug fixes **MUST** include regression tests.
- Test coverage **SHOULD** be maintained above 80%.

### Test Organization
- Tests **SHOULD** be organized in a `tests/` directory mirroring the source structure.
- Each module **SHOULD** have a corresponding test module.
- Use fixtures for common test data and setup.

## Coding Style

This project enforces a consistent coding style to maintain high code quality and readability. The following rules are mandatory.

### Style Enforcement with `ruff`
- Code formatting and linting **MUST** be enforced using [`ruff`](https://github.com/astral-sh/ruff). Ruff rules are defined in `pyproject.toml`.
- A pre-commit hook is provided to automatically format and lint code. **It MUST be installed** and passing before commits are made.
- All code **MUST** pass ruff checks without warnings or errors.

### Type Annotations
- This project is [`py.typed`](https://peps.python.org/pep-0561/). Type annotations **MUST** be used extensively.
- **Functions/Methods**: All function and method signatures **MUST** include type hints for parameters and return values.
- **Variables**: Type hints **SHOULD** be added for module-level and class-level variables, as well as for local variables where the type is not immediately obvious from the assignment.
- **Tools**: Use [`basedpyright`](https://github.com/DetachHead/basedpyright) in your IDE alongside `ruff` for full static type checking.
- **Generic Types**: Use proper generic type annotations (e.g., `List[str]`, `Dict[str, Any]`) instead of bare types.

### Code Standards

**MUST use uv for python usage, includes and not limited to following cases**

- Coding agent python debuging, use uv run python ...
- Writing scripts, use uv run python ...
- etc

#### Critical Requirements for Coding Agents (Claude Code, etc.)
- **Context7 MCP Usage**: When Coding Agents (such as Claude Code) need to plan, implement, or use third-party libraries, they **MUST**:
  1. Use Context7's MCP (Model Context Protocol) to obtain the official documentation for the specific version of the library
  2. **NEVER** rely on assumed or remembered API patterns without verification
  3. **ALWAYS** verify method signatures, parameter names, and return types against the official documentation
  4. Maintain strict accuracy and avoid any speculation or assumptions about library behavior
- **Documentation First**: Before writing any code that uses a third-party library, the Coding Agent **MUST**:
  1. Query Context7 MCP for the exact version's documentation
  2. Read the relevant sections of the documentation
  3. Only then write code that strictly follows the documented API
- **No Assumptions**: Coding Agents **MUST NOT**:
  1. Guess at API behavior based on common patterns
  2. Assume backward compatibility without verification
  3. Use deprecated methods without explicit acknowledgment
  4. Write code based on documentation from different versions

#### Minimal Design Principle (最小化设计原则)

- **Simplicity First**: Coding Agents **MUST** prioritize simple, straightforward solutions over complex architectures.
- **Avoid Over-Engineering**: Coding Agents **MUST NOT**:
  1. Add abstractions or patterns that are not immediately necessary
  2. Implement features that are not explicitly required
  3. Create overly generic solutions for specific problems
  4. Add extensive configuration systems when simple hardcoding suffices
  5. Introduce unnecessary layers of indirection
- **Think Before Implementation**: Before writing code, Coding Agents **MUST**:
  1. Question whether each component is truly necessary
  2. Consider the simplest approach that fulfills the requirements
  3. Evaluate the maintenance cost of proposed solutions
  4. Prefer composition over inheritance when both work
  5. Ask: "Can this be done with less code while maintaining clarity?"
- **Progressive Complexity**: Coding Agents **SHOULD**:
  1. Start with the simplest working solution
  2. Add complexity only when requirements explicitly demand it
  3. Refactor for generalization only after patterns emerge from actual usage
  4. Document the reasoning when adding complexity
- **Code Economy**: 
  1. Fewer lines of clear code **SHOULD** be preferred over more lines of generic code
  2. Built-in language features **SHOULD** be preferred over external libraries when sufficient
  3. Direct solutions **SHOULD** be preferred over framework-heavy approaches
- **Maintainability Focus**: All design decisions **MUST** consider:
  1. How easy it is for humans to understand the code
  2. How easy it is to modify or extend in the future
  3. How easy it is to debug when issues arise
  4. The cognitive load imposed on future developers

**Example of Over-Engineering to Avoid**:

```python
# ❌ Over-engineered: Complex factory pattern for a simple case
class UserFactory:
    @staticmethod
    def create_user(user_type: str, **kwargs) -> BaseUser:
        if user_type == "admin":
            return AdminUser(**kwargs)
        elif user_type == "regular":
            return RegularUser(**kwargs)
        # ... complex type resolution logic

# ✅ Simple and sufficient: Direct instantiation
def create_admin(name: str, email: str) -> User:
    return User(name=name, email=email, role="admin")

def create_regular_user(name: str, email: str) -> User:
    return User(name=name, email=email, role="user")
```

**Guiding Questions Before Implementation**:
- Is this abstraction solving a real problem or a hypothetical one?
- Will this code be easier to understand in 6 months?
- Am I adding this because it's needed, or because it's "proper architecture"?
- Can I achieve the same goal with standard library functions?
- What is the simplest thing that could possibly work?


#### Import Organization
- Imports **MUST** be organized according to PEP 8:
  1. Standard library imports
  2. Related third-party imports
  3. Local application/library imports
- Each group **SHOULD** be separated by a blank line.
- Use `from` imports sparingly and only for commonly used items.

#### Dependency Management and Version Consistency
- **Version Pinning**: All third-party packages **MUST** have their versions explicitly pinned in `pyproject.toml`.
- **Version Consistency**: When using third-party packages, developers **MUST**:
  1. Check the exact version being used in the project dependencies
  2. Use Context7's MCP (Model Context Protocol) tools to obtain the complete documentation for that specific version
  3. Verify that all API calls, method signatures, and usage patterns match the documented interface for that exact version
  4. **MUST NOT** assume API compatibility across different versions without explicit verification
- **Documentation Verification**: Before implementing any third-party package functionality:
  1. **MUST** verify the API documentation matches the installed version
  2. **SHOULD** check for deprecation warnings in the target version
  3. **MUST** ensure all imported modules and functions exist in the specified version
- **Version Updates**: When updating dependencies:
  1. **MUST** review the changelog between versions
  2. **MUST** update all usage to match the new API if breaking changes exist
  3. **MUST** run comprehensive tests after version updates

#### Code Organization
- **Maximum Line Length**: Lines **MUST NOT** exceed 88 characters (ruff default).
- **Function Length**: Functions **SHOULD** be kept under 50 lines. Functions exceeding 100 lines **MUST** be refactored.
- **Class Design**: Classes **SHOULD** follow the Single Responsibility Principle.
- **Constants**: Module-level constants **MUST** be in UPPER_SNAKE_CASE.

#### Error Handling
- **Exception Handling**: Use specific exception types rather than bare `except:` clauses.
- **Custom Exceptions**: Create custom exception classes for domain-specific errors.
- **Logging**: Use the `logging` module instead of `print()` statements for debugging and information output.

#### Performance Considerations
- **List Comprehensions**: Prefer list comprehensions over `map()` and `filter()` when readable.
- **Context Managers**: Use context managers (`with` statements) for resource management.
- **Avoid Premature Optimization**: Focus on code clarity first, optimize only when profiling indicates bottlenecks.

### Docstrings
- All public modules, classes, and functions **MUST** have docstrings.
- We **RECOMMEND** using the **[Sphinx-style](https://sphinx-rtd-tutorial.readthedocs.io/en/latest/docstrings.html)** to write docstrings, and:
  - **`:type` and `:rtype`** **SHOULD** be omitted (type hints provide this information).
  - **`:raises`** **SHOULD** be included for functions that raise specific exceptions.
  - **`:param`** descriptions **MUST** be clear and concise.

#### Docstring Examples

**Function Docstring (Sphinx-style):**
```python
def fetch_memory(user_id: str, memory_id: int) -> MemoryModel:
    """Fetch a specific memory for a given user.

    :param user_id: The unique identifier of the user.
    :param memory_id: The unique identifier of the memory to retrieve.
    :return: An instance of MemoryModel containing the requested memory.
    :raises MemoryNotFoundError: If no memory exists for the given IDs.
    :raises ValueError: If user_id is empty or memory_id is negative.
    """
    ...
```

**Class Docstring:**
```python
class MemoryManager:
    """Manages user memories and provides retrieval capabilities.
    
    This class handles the storage, retrieval, and management of user memories
    in the Puzle Echo system. It provides both synchronous and asynchronous
    methods for memory operations.
    
    :param config: Configuration object containing database and API settings.
    :param logger: Optional logger instance for debugging and monitoring.
    """
    ...
```

## Git Conventions

This section defines all version control-related collaboration protocols for this project. The goal is to maintain a clear, traceable repository history and streamline the collaboration process. All contributors **MUST** adhere to this policy.

### Branch Conventions
This project employs a simplified **GitHub Flow** convention.

*   **`main` branch**:
    *   The code in the `main` branch **MUST** always be deployable and stable.
    *   Direct pushes to the `main` branch **MUST NOT** be allowed. All changes **MUST** be incorporated via Pull Requests (PRs).
    *   All commits on `main` **MUST** pass CI/CD checks.

*   **Feature/Fix Branches**:
    *   All new work **MUST** be done in a new descriptive branch created from the latest `main` branch.
    *   Branches **SHOULD** be short-lived and focused on a single feature or fix.
    *   **Branch Naming Convention**:
        *   **Feature**: `feat/[short-description]` (e.g., `feat/hybrid-retriever`)
        *   **Bug Fix**: `fix/[issue-number]-[short-description]` (e.g., `fix/123-typo-in-readme`)
        *   **Documentation**: `docs/[short-description]` (e.g., `docs/update-contrib-guide`)
        *   **Refactor**: `refactor/[short-description]` (e.g., `refactor/memory-manager-class`)
        *   **Chore**: `chore/[short-description]` (e.g., `chore/deps-update`)
        *   **Test**: `test/[short-description]` (e.g., `test/add-integration-tests`)
    *   Branch names **MUST** be in kebab-case (lowercase words separated by hyphens) and **MUST** be clearly descriptive.

### Commit Message Convention
Commit messages **MUST** strictly follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification. This enables automated changelog generation and improves history readability.

*   **Format**: `<type>(<scope>): <subject>`
    *   **`type`**: Describes the nature of the commit. **MUST** be one of the following:
        *   `feat`: A new feature
        *   `fix`: A bug fix
        *   `docs`: Documentation only changes
        *   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
        *   `refactor`: A code change that neither fixes a bug nor adds a feature
        *   `perf`: A code change that improves performance
        *   `test`: Adding missing tests or correcting existing tests
        *   `chore`: Changes to the build process, auxiliary tools, or libraries
        *   `ci`: Changes to CI configuration files and scripts
        *   `build`: Changes that affect the build system or external dependencies
    *   **`scope`** (Optional): **SHOULD** indicate the module or component affected by the change (e.g., `retrievers`, `api`, `docker`, `tests`).
    *   **`subject`**: A brief, imperative-tense description of the change. **MUST** be in the present tense, sentence case, and **MUST NOT** be terminated by a period. **SHOULD** be under 50 characters.
    
*   **Body** (Optional): **SHOULD** be used for commits that require additional explanation. **MUST** be separated from the subject by a blank line.

*   **Footer** (Optional): **SHOULD** reference issues or breaking changes. Format: `Fixes #123` or `BREAKING CHANGE: description`.

*   **Examples**:
    *   `feat(retrievers): add cosine similarity search support`
    *   `fix(api): handle null value in memory creation endpoint`
    *   `docs: update quickstart guide with uv examples`
    *   `test(schemas): add unit tests for memory model validation`
    *   `chore(deps): upgrade pydantic to v2.5`
    *   `refactor(memory): extract common validation logic`

### Pull Request Guidelines
*   **Title**: **MUST** follow the same convention as commit messages.
*   **Description**: **MUST** include:
    *   A clear description of what the PR does
    *   Link to related issues (if applicable)
    *   Screenshots or examples (if applicable)
    *   Testing instructions
*   **Size**: PRs **SHOULD** be kept small and focused. Large PRs **SHOULD** be split into smaller, logical commits.
*   **Review**: All PRs **MUST** be reviewed by at least one other contributor before merging.
*   **CI/CD**: All automated checks **MUST** pass before merging.

## Code Quality Assurance

### Pre-commit Hooks
The following checks **MUST** pass before any commit:
- Code formatting with `ruff`
- Linting with `ruff`
- Type checking with `basedpyright`
- Basic test execution

### Continuous Integration
All PRs **MUST** pass the following CI checks:
- Full test suite execution
- Code coverage report
- Security vulnerability scanning
- Dependency license checking

## Documentation Standards

### Code Documentation
- **README**: Keep the main README.md up-to-date with installation, usage, and contribution instructions.
- **API Documentation**: Public APIs **MUST** be documented with examples.
- **Changelog**: Maintain a CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/) format.

### Comments
- **Purpose**: Comments **SHOULD** explain "why" not "what".
- **TODO Comments**: **MUST** include a date and assignee: `# TODO(username, 2024-01-15): Implement error retry logic`
- **Complex Logic**: Non-obvious algorithms or business logic **MUST** be commented.

This guideline ensures consistent, maintainable, and high-quality code across the project. All contributors are expected to follow these standards to maintain the project's integrity and collaboration efficiency.