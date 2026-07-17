from node:22-alpine
workdir /app
copy package*.json ./
run npm install
copy . .
expose 5000
cmd ["npm","start"]