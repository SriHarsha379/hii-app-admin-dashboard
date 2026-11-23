const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

code = code.replace(
  `    } catch { } finally { setIsDeletingVenue(false); }`,
  `    } catch (err: any) { 
      toastError(err?.message || 'Failed to delete club');
    } finally { 
      setIsDeletingVenue(false); 
    }`
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
