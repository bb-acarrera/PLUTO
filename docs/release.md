# Release Instructions

Below are the steps followed for releasing a new version (milestone) of PLUTO

1. Make sure changelog.md is up to date
1. Make sure local GIT on develop is current
1. Run 'npm run test' and make sure all unit tests pass
1. Run 'npm run build'
1. Run 'npm run start_docker'
1. Test this running version.
1. Tag develop to 'v'… as in the package.json
1. Do pull request to merge develop onto master
    1. Make sure the merge is going in the right direction
1. Update changelog.md to new version.
1. Update package.json to new version.
1. Do 'npm run build' to update remaining stuff needing the new version.
1. Commit these last few changes.
1. Create a new GitHub Milestone
1. Delete really old milestones if all jobs complete
1. Move unfinished jobs to new milestone
