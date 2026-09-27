# Landing work

When a requested change in this repo is finished, land it. Do not wait to be asked to commit, push, open a pull request, or merge.

The work log in `docs/12-tech-stack-approach.md` is the rule for issues. Open or reuse an issue when the change alters a locked rule, a page sentence, the stack, a signal, a vendor, or behavior a holder can see. A wording fix that leaves behavior and locked sentences alone needs no new issue. The pull request body contains `Fixes #N` when that issue should close.

Before merging, run the tests that cover the change. Do not merge a failing suite.

Commit only the finished work. Do not commit `.env` or any other secret, and do not put API keys, `.env` values, holdings, or net worth in a commit, an issue, or a pull request.

Push the branch and open a pull request into `main`. This account's `gh pr create` and `gh pr merge` calls are denied by the token. Open the pull request with the GitHub MCP tool `github__create_pull_request`, and merge it with `github__merge_pull_request`. Then fast-forward the local `main`.

Do not open a pull request for an unfinished attempt, a question, or a throwaway experiment. Do not force-push.
