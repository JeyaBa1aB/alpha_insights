import React, { useState } from 'react';
import GlassmorphicCard from '../GlassmorphicCard';
import GradientButton from '../GradientButton';

const OrderForm = ({ symbol, currentPrice, onSubmit, onCancel }) => {
  const [orderData, setOrderData] = useState({
    symbol: symbol || '',
    orderType: 'market',
    side: 'buy',
    quantity: '',
    price: '',
    stopPrice: '',
    timeInForce: 'day',
    notes: ''
  });

  const [estimatedCost, setEstimatedCost] = useState(0);

  React.useEffect(() => {
    const quantity = parseFloat(orderData.quantity) || 0;
    const price = orderData.orderType === 'market' 
      ? currentPrice 
      : parseFloat(orderData.price) || currentPrice;
    
    setEstimatedCost(quantity * price);
  }, [orderData.quantity, orderData.price, orderData.orderType, currentPrice]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!orderData.symbol || !orderData.quantity) {
      return;
    }

    if (orderData.orderType !== 'market' && !orderData.price) {
      return;
    }

    onSubmit({
      ...orderData,
      quantity: parseFloat(orderData.quantity),
      price: orderData.price ? parseFloat(orderData.price) : null,
      stopPrice: orderData.stopPrice ? parseFloat(orderData.stopPrice) : null,
      estimatedCost
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Advanced Order</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stock Symbol
              </label>
              <input
                type="text"
                name="symbol"
                value={orderData.symbol}
                onChange={handleInputChange}
                placeholder="e.g., AAPL"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                required
              />
              {symbol && (
                <p className="text-xs text-gray-400 mt-1">
                  Current Price: {formatCurrency(currentPrice)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order Side
              </label>
              <select
                name="side"
                value={orderData.side}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>

          {/* Order Type and Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order Type
              </label>
              <select
                name="orderType"
                value={orderData.orderType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="market">Market Order</option>
                <option value="limit">Limit Order</option>
                <option value="stop">Stop Loss</option>
                <option value="stop_limit">Stop Limit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantity (Shares)
              </label>
              <input
                type="number"
                name="quantity"
                value={orderData.quantity}
                onChange={handleInputChange}
                placeholder="100"
                min="1"
                step="1"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Price Fields */}
          {(orderData.orderType === 'limit' || orderData.orderType === 'stop_limit') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limit Price
              </label>
              <input
                type="number"
                name="price"
                value={orderData.price}
                onChange={handleInputChange}
                placeholder={currentPrice?.toFixed(2) || "0.00"}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                required
              />
            </div>
          )}

          {(orderData.orderType === 'stop' || orderData.orderType === 'stop_limit') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stop Price
              </label>
              <input
                type="number"
                name="stopPrice"
                value={orderData.stopPrice}
                onChange={handleInputChange}
                placeholder={currentPrice?.toFixed(2) || "0.00"}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                required
              />
            </div>
          )}

          {/* Time in Force */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time in Force
            </label>
            <select
              name="timeInForce"
              value={orderData.timeInForce}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="day">Day Order</option>
              <option value="gtc">Good Till Canceled</option>
              <option value="ioc">Immediate or Cancel</option>
              <option value="fok">Fill or Kill</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={orderData.notes}
              onChange={handleInputChange}
              placeholder="Add any notes about this order..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Order Summary */}
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <h4 className="text-white font-medium mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Order Type:</span>
                <span className="text-white capitalize">{orderData.orderType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Side:</span>
                <span className={`capitalize ${orderData.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {orderData.side}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white">{orderData.quantity || 0} shares</span>
              </div>
              {orderData.orderType !== 'market' && orderData.price && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white">{formatCurrency(parseFloat(orderData.price))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-600 pt-2">
                <span className="text-gray-400">Estimated Cost:</span>
                <span className="text-white font-medium">{formatCurrency(estimatedCost)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <GradientButton 
              type="submit" 
              className="flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Place {orderData.orderType.replace('_', ' ')} Order
            </GradientButton>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors border border-slate-600 rounded-lg hover:border-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;