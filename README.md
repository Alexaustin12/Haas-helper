# Haas-helper
A skill which displays a person's picture to the Echo Show when their name is requested.

High level steps for this skill:
1) I created a postgresSQL database instance on Amazon RDS to store student names, fun fact, and a link to their picture
2) Create an Amazon S3 bucket where I store the image files for each student
3) Connect to the database from Lambda function (index.js) and query the database using SQL to request desired data
4) Return relevant info to the User's Echo Show or Alexa App
