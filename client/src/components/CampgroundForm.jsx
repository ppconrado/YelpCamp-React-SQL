import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCampground, updateCampground } from '../api/campgrounds';
import { useFlash } from '../context/FlashContext';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import SubmitButton from './ui/SubmitButton';
import { compressImage } from '../utils/imageCompression';
import MapboxGeocoder from './MapboxGeocoder';

const campgroundSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  location: z.string().min(3, 'Localização deve ter pelo menos 3 caracteres'),
  price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
  description: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
});

const CampgroundForm = ({ initialData = {}, isEdit = false }) => {
  const [imageFile, setImageFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const { showFlash } = useFlash();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(campgroundSchema),
    defaultValues: {
      title: initialData.title || '',
      location: initialData.location || '',
      price: initialData.price || 0,
      description: initialData.description || '',
    },
  });

  // Warn user about unsaved changes
  useUnsavedChanges(isDirty && !isSubmitting);

  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        title: initialData.title || '',
        location: initialData.location || '',
        price: initialData.price || 0,
        description: initialData.description || '',
      });

      // Set location data if editing and geometry exists
      if (initialData.geometry && initialData.geometry.coordinates) {
        setLocationData({
          placeName: initialData.location,
          coordinates: initialData.geometry.coordinates,
          placeType: 'existing',
        });
        // Also set the form value
        setValue('location', initialData.location, { shouldValidate: true });
      }
    }
  }, [isEdit, initialData, reset, setValue]);

  const onSubmit = async (data) => {
    // Validate that location has been selected via geocoder
    if (!locationData) {
      showFlash('Please select a location from the suggestions', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('campground[title]', data.title);
    formData.append('campground[location]', locationData.placeName);
    formData.append('campground[price]', data.price);
    formData.append('campground[description]', data.description);

    // Send geometry data in the correct format
    formData.append('campground[geometry][type]', 'Point');
    formData.append(
      'campground[geometry][coordinates][0]',
      locationData.coordinates[0]
    );
    formData.append(
      'campground[geometry][coordinates][1]',
      locationData.coordinates[1]
    );

    if (imageFile) {
      // Compress image before upload
      setIsCompressing(true);
      try {
        const compressedImage = await compressImage(imageFile);
        formData.append('image', compressedImage);
      } catch (error) {
        console.error('Image compression error:', error);
        // Fall back to original file if compression fails
        formData.append('image', imageFile);
      } finally {
        setIsCompressing(false);
      }
    }

    try {
      let response;
      if (isEdit) {
        response = await updateCampground(initialData.id, formData);
      } else {
        response = await createCampground(formData);
      }
      showFlash(response.message, 'success');
      navigate(`/campgrounds/${response.campground.id}`);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Erro ao salvar acampamento.';
      showFlash(errorMessage, 'error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="validated-form"
      encType="multipart/form-data"
      noValidate
    >
      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.title ? 'is-invalid' : ''}`}
          id="title"
          placeholder="Title"
          {...register('title')}
        />
        <label htmlFor="title">Title</label>
        {errors.title && (
          <div className="invalid-feedback">{errors.title.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="location">
          Location
        </label>
        <MapboxGeocoder
          onSelect={(location) => {
            setLocationData(location);
            // Update the form field value for validation
            setValue('location', location.placeName, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
          placeholder="Search for campground location... (e.g., Yosemite Valley, 1234 Main St)"
          initialValue={initialData.location || ''}
          types="address,poi,place,locality"
        />
        {locationData && (
          <div className="alert alert-success mt-2 py-2 px-3">
            <small>
              <strong>📍 Selected:</strong> {locationData.placeName}
              <br />
              <span className="text-muted">
                Coordinates: {Number(locationData.coordinates[1]).toFixed(6)},{' '}
                {Number(locationData.coordinates[0]).toFixed(6)}
                {locationData.placeType && ` • Type: ${locationData.placeType}`}
              </span>
            </small>
          </div>
        )}
        {errors.location && (
          <div className="text-danger mt-1">
            <small>{errors.location.message}</small>
          </div>
        )}
        <div className="form-text">
          Start typing to see suggestions. Select a location from the dropdown
          for precise coordinates.
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="price">
          Campground Price
        </label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            type="number"
            step="0.01"
            className={`form-control ${errors.price ? 'is-invalid' : ''}`}
            id="price"
            placeholder="0.00"
            {...register('price')}
          />
          {errors.price && (
            <div className="invalid-feedback">{errors.price.message}</div>
          )}
        </div>
      </div>

      <div className="form-floating mb-3">
        <textarea
          className={`form-control ${errors.description ? 'is-invalid' : ''}`}
          id="description"
          placeholder="Description"
          style={{ height: '120px' }}
          {...register('description')}
        ></textarea>
        <label htmlFor="description">Description</label>
        {errors.description && (
          <div className="invalid-feedback">{errors.description.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="image" className="form-label">
          Add Image
          {isCompressing && (
            <span className="ms-2 text-muted">
              <span
                className="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Optimizing image...
            </span>
          )}
        </label>
        <input
          className="form-control"
          type="file"
          id="image"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          disabled={isCompressing}
        />
        <div className="form-text">
          Images will be automatically compressed and resized for optimal
          performance.
        </div>
      </div>

      <SubmitButton
        loading={isSubmitting || isCompressing}
        className="btn btn-success"
      >
        {isEdit ? 'Update Campground' : 'Add Campground'}
      </SubmitButton>
    </form>
  );
};

export default CampgroundForm;
