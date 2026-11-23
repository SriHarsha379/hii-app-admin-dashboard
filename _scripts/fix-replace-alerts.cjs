const fs = require('fs');
const path = require('path');

const pages = [
  'src/pages/Clubs.tsx',
  'src/pages/Events.tsx',
  'src/pages/AdsBroadcast.tsx',
  'src/pages/PollsContests.tsx',
  'src/pages/Users.tsx',
  'src/pages/OrganiserRequests.tsx',
];

pages.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  const original = code;

  // Add useToast import if not present
  if (!code.includes('useToast')) {
    code = code.replace(
      `import { useAuth } from '../context/AuthContext';`,
      `import { useAuth } from '../context/AuthContext';\nimport { useToast } from '../context/ToastContext';`
    );
    // Add hook call after queryClient
    code = code.replace(
      `const queryClient = useQueryClient();`,
      `const queryClient = useQueryClient();\n  const { success, error: toastError } = useToast();`
    );
  }

  // Replace alert() error calls
  code = code.replace(/alert\(err\.message \|\| ['"](.+?)['"]\)/g, `toastError('$1', err.message)`);
  code = code.replace(/alert\(['"](.+?)['"]\)/g, `toastError('$1')`);

  // Add success toasts after invalidateQueries on save
  code = code.replace(
    `queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['venues-for-clubs'] }); // FIX: refresh venue data too
      setIsCreatingClub(false);
      resetVenueForm();`,
    `queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['venues-for-clubs'] });
      setIsCreatingClub(false);
      resetVenueForm();
      success(isEditingVenue ? 'Club updated' : 'Club added', 'Changes saved successfully');`
  );

  code = code.replace(
    `queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreatingEvent(false); setEventFormData(blankForm); setCreationStep(1);`,
    `queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreatingEvent(false); setEventFormData(blankForm); setCreationStep(1);
      success(isEditingEvent ? 'Event updated' : 'Event created', 'Changes saved successfully');`
  );

  if (code !== original) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Updated:', filePath);
  } else {
    console.log('No changes:', filePath);
  }
});
