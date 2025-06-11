export const handleDownloadReport = async () => {
  const response = await fetch('http://localhost:8003/FoodBridge/donations/generate-report/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
    }
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donation_report.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    alert('Failed to download report');
  }
};
