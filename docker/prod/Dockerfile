# Multi stage build


# --------------------------First stage------------------------------------------
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

# It will instal only the dependencies that are listed under tha package-lock.json
RUN npm ci

COPY . .

RUN npm run build


#------------------------ Second stage--------------------------------------------------- 
FROM node:18-alpine as production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

# --ignore-scripts flag ignores the scripts under package json for security reason
# Since we mentioned NODE_ENV as production, thus, it will not install any dev dependencies
# Else if we won't do ENV NODE_ENV=production, then we have to pass one more flag as --omit-dev
RUN npm ci --ignore-scripts 

COPY --from=builder /app/dist ./

EXPOSE 5500

CMD ["node","src/server.js",]
