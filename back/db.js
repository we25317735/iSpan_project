import mysql from 'mysql2'

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'coffee',
  password: 'a12345',
  database: 'igotbrew',
})

export default connection
