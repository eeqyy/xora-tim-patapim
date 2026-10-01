# Gunakan base image Node.js 20 versi alpine yang ringan
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Install dependensi
RUN npm install

# Copy sisa source code ke dalam container
COPY . .

# Ekspose port yang digunakan frontend Vite
EXPOSE 5173

# Jalankan Vite dev server dengan flag --host
# Flag --host penting agar web bisa diakses dari browser di luar container (melalui port mapping)
CMD ["npm", "run", "dev", "--", "--host"]
