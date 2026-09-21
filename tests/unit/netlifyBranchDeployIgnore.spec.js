/* eslint-env mocha */
// =============================================================================
// netlify.toml: a release tag is not built (v1.5.115). Each release is pushed as
// a commit on main and an annotated tag ("1.5.114"). Netlify builds every ref
// that is pushed, a tag too, as a "branch deploy" named after it: a second
// build, for every release, of a site nobody looks at. An `ignore` command in
// the branch-deploy context skips those (exit 0 skips a build) and lets every
// other ref through, the Astro migration branch among them. Production is not
// a branch deploy and does not run it. The command is run here as Netlify runs
// it, with $BRANCH set.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const toml = fs.readFileSync(path.join(process.cwd(), "netlify.toml"), "utf8");
const table = (name) =>
  (toml.split(/^(?=\[)/m).find((t) => t.startsWith(`[${name}]`)) || "").replace(
    /^\s*#.*$/gm,
    ""
  );
const command = (table("context.branch-deploy").match(
  /^\s*ignore\s*=\s*'([^']*)'/m
) || [])[1];

const SKIPPED = 0;
const exitCode = (shell, branch) =>
  spawnSync(shell, ["-c", command], {
    env: { PATH: process.env.PATH, BRANCH: branch },
  }).status;

describe("netlify.toml: which branch deploys are built", () => {
  it("has the rule, for branch deploys only", () => {
    expect(command, "[context.branch-deploy] ignore").to.be.a("string");
    expect(table("build")).to.not.match(/^\s*ignore\s*=/m);
    expect(table("context.production")).to.not.match(/^\s*ignore\s*=/m);
  });

  ["sh", "bash"].forEach((shell) => {
    it(`skips a release tag (${shell})`, () => {
      ["1.5.115", "1.6.0", "2.0.0", "10.20.30"].forEach((tag) =>
        expect(exitCode(shell, tag), tag).to.equal(SKIPPED)
      );
    });

    it(`builds every other ref (${shell})`, () => {
      [
        "feat/astro-migration",
        "feat/astro-researchhub-fixes",
        "legacy-vue",
        "dependabot/npm_and_yarn/astro/astro-7.2.8",
        "fix/1.5.115",
        "v1.5.115",
        "1.5.115-rc1",
        "1.5",
        "",
      ].forEach((ref) =>
        expect(exitCode(shell, ref), `"${ref}"`).to.not.equal(SKIPPED)
      );
    });
  });

  it("leaves the Astro migration branch its own build", () => {
    const astro = table('context."feat/astro-migration"');
    expect(astro).to.match(/^\s*base\s*=\s*"astro"/m);
    expect(astro).to.match(/^\s*command\s*=\s*"pnpm build"/m);
    expect(astro).to.not.match(/^\s*ignore\s*=/m);
  });
});
