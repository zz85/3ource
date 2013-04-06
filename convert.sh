target=../three.js
cwd=`pwd`
cd $target

git log --pretty=format:'\"%h\": {%n  \"commit\": \"%H\",%n  \"author\": \"%an <%ae>\",%n  \"date\": \"%ad\",%n  \"message\": \"%s\"%n}' > $cwd/test.json

cd $cwd