import { paymentsApi } from '../api/client'

const SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

function loadScript() {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

/**
 * Run a Razorpay Checkout for a template or the Pro plan.
 * Resolves with the verification result, rejects on failure/cancel.
 */
export async function checkout({ itemType, itemId }) {
  const ok = await loadScript()
  if (!ok) throw new Error('Could not load Razorpay. Check your connection.')
  const order = await paymentsApi.createOrder({ item_type: itemType, item_id: itemId })

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      order_id: order.order_id,
      prefill: order.prefill,
      theme: { color: '#4f46e5' },
      handler: async (response) => {
        try {
          resolve(await paymentsApi.verify(response))
        } catch (e) {
          reject(e)
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    })
    rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed')))
    rzp.open()
  })
}
