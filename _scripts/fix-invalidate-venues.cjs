const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

code = code.replace(
  `      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['mongo-vendors'] });
      setIsCreatingClub(false);`,
  `      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['mongo-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['venues-for-clubs'] });
      toastSuccess('Club saved successfully!');
      setIsCreatingClub(false);`
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
