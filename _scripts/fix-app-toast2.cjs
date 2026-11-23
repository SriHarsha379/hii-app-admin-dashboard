const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove duplicate import
code = code.replace(`import { ToastProvider } from './components/Toast';\n`, '');

// Fix nesting - ToastProvider should wrap AuthProvider
code = code.replace(
  `    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>`,
  `    <QueryClientProvider client={queryClient}>
        <ToastProvider>
      <AuthProvider>`
);

code = code.replace(
  `        </AuthProvider>
        </ToastProvider>
    </QueryClientProvider>`,
  `      </AuthProvider>
        </ToastProvider>
    </QueryClientProvider>`
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('Done');
