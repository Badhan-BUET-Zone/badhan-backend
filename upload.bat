git checkout test-branch
@echo off "git upload "
set /p message="Enter commit message: "
node doc/swagger.js
git add .
git commit -am "%message%"
git push origin test-branch
npm run serve