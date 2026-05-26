import express from 'express';
import dotenv from 'dotenv';
import routes from './router/index.mjs';

dotenv.config();

const app = express();
const port = process.env.NODE_PORT || 3000;


app.get('/', (req, res) => {
  res.send('API is running');
});

app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
