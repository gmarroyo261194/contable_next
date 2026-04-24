export async function generatePagos360Link(paymentData: any) {
  try {
    const url = process.env.PAGOS360_URL || 'https://api.sandbox.pagos360.com';
    const token = process.env.PAGOS360_TOKEN;

    if (!token) {
      throw new Error("El token de Pagos360 no está configurado");
    }

    const response = await fetch(`${url}/payment-request`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_request: {
          description: paymentData.description,
          first_due_date: paymentData.first_due_date,
          first_total: paymentData.first_total,
          payer_name: paymentData.payer_name,
          payer_email: paymentData.payer_email,
          metadata: paymentData.metadata
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Error desde Pagos360:", data);
      throw new Error(`Error generando link de pago: ${data.message || 'Error desconocido'}`);
    }

    return {
      success: true,
      data: {
        id: data.id,
        checkout_url: data.checkout_url,
        state: data.state,
      }
    };
  } catch (error: any) {
    console.error("Error en generatePagos360Link:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
