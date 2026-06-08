# Plan: Extract Science Lab Hero to a Separate Repository

## Goal
Extract the `Game/ScienceLabHero/` folder from `PascalRescue` repository into a standalone repository `ScienceLabHero` on GitHub.

## Steps
1.  **Preparation**:
    *   Verify all files in `Game/ScienceLabHero/`.
2.  **Repository Creation**:
    *   Create a new GitHub repository named `ScienceLabHero` using `gh repo create`.
3.  **Migration**:
    *   Create a temporary directory for the new repo content.
    *   Copy files from `Game/ScienceLabHero/` to the new repo directory.
    *   Initialize git in the new repo directory, commit the files, and push to the new GitHub repository.
4.  **Repository Cleanup**:
    *   Remove `Game/ScienceLabHero/` from the `PascalRescue` repository.
    *   Commit and push the cleanup to `PascalRescue`.
5.  **Final Verification**:
    *   Confirm the new repository is on GitHub and the old files are removed.

## Risks
*   **Authentication**: If `gh` CLI is not properly authenticated for repo creation.
*   **Data Loss**: Ensure files are successfully pushed before removing from the original repo.
