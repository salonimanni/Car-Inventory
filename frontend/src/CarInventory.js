import React, { useState, useEffect } from 'react';
import './App.css';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const CarInventory = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCar, setNewCar] = useState({
    id: '',
    model: '',
    manufacturer: '',
    price: '',
    stock: ''
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/cars');
      const result = await response.json();
      
      if (result.success) {
        setCars(result.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/cars/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        fetchCars();
      } else {
        setError('Failed to delete car');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error deleting car:', err);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCar,
          id: parseInt(newCar.id),
          price: parseFloat(newCar.price),
          stock: parseInt(newCar.stock)
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        fetchCars();
        setIsModalOpen(false);
        setNewCar({ id: '', model: '', manufacturer: '', price: '', stock: '' });
      } else {
        setError('Failed to add car');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error adding car:', err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCar({ id: '', model: '', manufacturer: '', price: '', stock: '' });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const averagePrice = cars.length 
    ? cars.reduce((sum, car) => sum + car.price, 0) / cars.length 
    : 0;

  return (
    <div className="App">
      <h1>Car Inventory</h1>
      <p>Average Price: ₹{averagePrice.toLocaleString('en-IN')}</p>
      
      <button 
        onClick={() => setIsModalOpen(true)}
        className="btn-add"
      >
        Add Car
      </button>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="modal-header">
          <h2>Add New Car</h2>
          <button 
            onClick={closeModal}
            className="close-button"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleAddCar} className="form-beautiful">
          <div className="form-row">
            <label>ID</label>
            <input
              type="number"
              value={newCar.id}
              onChange={(e) => setNewCar({...newCar, id: e.target.value})}
              required
              placeholder="Enter ID"
              min="1"
            />
          </div>
          <div className="form-row">
            <label>Model</label>
            <input
              type="text"
              value={newCar.model}
              onChange={(e) => setNewCar({...newCar, model: e.target.value})}
              required
              placeholder="Enter model name"
            />
          </div>
          <div className="form-row">
            <label>Manufacturer</label>
            <input
              type="text"
              value={newCar.manufacturer}
              onChange={(e) => setNewCar({...newCar, manufacturer: e.target.value})}
              required
              placeholder="Enter manufacturer name"
            />
          </div>
          <div className="form-row">
            <label>Price</label>
            <input
              type="number"
              value={newCar.price}
              onChange={(e) => setNewCar({...newCar, price: e.target.value})}
              required
              placeholder="Enter price"
              min="0"
            />
          </div>
          <div className="form-row">
            <label>Stock</label>
            <input
              type="number"
              value={newCar.stock}
              onChange={(e) => setNewCar({...newCar, stock: e.target.value})}
              required
              placeholder="Enter stock quantity"
              min="0"
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-submit">Add Car</button>
            <button 
              type="button"
              onClick={closeModal}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Model</th>
            <th>Manufacturer</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              <td>{car.id}</td>
              <td>{car.model}</td>
              <td>{car.manufacturer}</td>
              <td>₹{car.price.toLocaleString('en-IN')}</td>
              <td>{car.stock}</td>
              <td>
                <button 
                  onClick={() => handleDelete(car.id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CarInventory;