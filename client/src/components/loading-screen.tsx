import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}