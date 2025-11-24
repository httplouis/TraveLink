/**
 * Helper function to download request PDF
 * Works for both travel orders and seminars
 */
export async function downloadRequestPDF(requestId: string, requestNumber?: string) {
  try {
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    loadingToast.textContent = 'Generating PDF...';
    document.body.appendChild(loadingToast);

    // Fetch PDF from API
    const response = await fetch(`/api/requests/${requestId}/pdf`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }

    // Get PDF blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename
    const filename = requestNumber 
      ? `${requestNumber}.pdf`
      : `request-${requestId}.pdf`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    document.body.removeChild(loadingToast);

    // Show success message
    const successToast = document.createElement('div');
    successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    successToast.textContent = 'PDF downloaded successfully!';
    document.body.appendChild(successToast);
    setTimeout(() => {
      document.body.removeChild(successToast);
    }, 3000);
  } catch (error: any) {
    console.error('[PDF Download] Error:', error);
    
    // Remove loading toast if still present
    const loadingToast = document.querySelector('.fixed.top-4.right-4.bg-blue-500');
    if (loadingToast) {
      document.body.removeChild(loadingToast);
    }

    // Show error message
    const errorToast = document.createElement('div');
    errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    errorToast.textContent = error.message || 'Failed to download PDF';
    document.body.appendChild(errorToast);
    setTimeout(() => {
      document.body.removeChild(errorToast);
    }, 3000);
  }
}

