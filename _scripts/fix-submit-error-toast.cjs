const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Replace setSubmitError with toastError in both catch blocks
code = code.replace(
  /setSubmitError\(err\.message \|\| 'Failed to save venue\. Please try again\.'\)/g,
  "toastError(err.message || 'Failed to save venue. Please try again.')"
);
code = code.replace(
  /setSubmitError\(err\.message \|\| 'Failed to save event\. Please try again\.'\)/g,
  "toastError(err.message || 'Failed to save event. Please try again.')"
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
