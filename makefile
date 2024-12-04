all:
	npm run build && npm run start

test:
	npm run test

publish:
	npm run build && npm publish