// Test de la route de réassignation des leads
const response = await fetch('https://3000-ie9gfowpsvwuw07requht-abd70c72.us2.manus.computer/api/trpc/admin.leads.reassignAll', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczNjQzMTg5NywiZXhwIjoxNzM5MDIzODk3fQ.mKCLCvxhvL6WYdCz0AwUBmJwEOXPPCrIvCLVFv8DfzI'
  },
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
