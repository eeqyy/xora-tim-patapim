# Gunakan base image Node.js 20 versi alpine yang ringan
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json (jika ada) terlebih dahulu
# Ini memanfaatkan caching Docker agar npm install tidak dijalankan ulang jika tidak ada perubahan package
COPY package*.json ./

# Install dependensi (termasuk nodemon)
RUN npm install

# Copy sisa source code ke dalam container
COPY . .

# Ekspose port yang digunakan backend
EXPOSE 5000

# Jalankan backend menggunakan nodemon untuk hot reload
# Pastikan entrypoint script backend kamu (misal index.js, server.js atau app.js)
CMD ["npx", "nodemon", "index.js"]
