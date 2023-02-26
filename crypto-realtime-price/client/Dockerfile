FROM node
WORKDIR /app
COPY package.json .
RUN npm i
COPY . .
## EXPOSE [Port you mentioned in the vite.config file]
EXPOSE 5173
CMD ["npm", "run", "dev"]

#Line by line explanation
#Create a node environment in the container
#Create a directory app and switch to that directory
#Runs npm install to create node_modules for your app
#Copies the source code to /app directory
#Exposes the port to access the app from outside the container i.e from the browser
#Executes npm run dev to start the server