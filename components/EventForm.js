/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Form, Button, Image, CloseButton,
} from 'react-bootstrap';
import { Rating } from 'react-simple-star-rating';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import AsyncCreatable from 'react-select/async-creatable';
import AsyncSelect from 'react-select/async';
import { useAuth } from '../utils/context/authContext';
import { uploadPhoto, deletePhoto } from '../api/cloudinary';
import { getCategories } from '../api/categories';
import { createEvent, updateEvent } from '../api/events/eventData';
import { getCity, getPoi } from '../api/tom-tom';
import getDaytimes from '../api/daytime';

const initialState = {
  title: '',
  date: '',
  daytime: '',
  category: '',
  location: 'Find Where You Were',
  lat: null,
  long: null,
  city: 'Search For Your City',
  description: '',
  rating: 0,
  public: false,
  photos: [],
};

function EventForm({ obj }) {
  const { user } = useAuth();
  const [input, setInput] = useState(initialState);
  const router = useRouter();

  const handleChange = (e) => {
    // eslint-disable-next-line prefer-const
    let { name, value } = e.target;
    if (name === 'public') {
      value = e.target.checked;
      setInput((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    } else {
      setInput((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleDaytime = (e) => {
    setInput((prevState) => ({
      ...prevState,
      daytime: e,
    }));
  };

  const handleCategory = (e) => {
    setInput((prevState) => ({
      ...prevState,
      category: e,
    }));
  };

  const handleRating = (e) => {
    const value = e;
    setInput((prevState) => ({
      ...prevState,
      rating: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (obj.id) {
      input.daytime = input.daytime.value;
      input.category = input.category.value;
      updateEvent(input).then(() => {
        router.push('/user/profile');
      });
    } else {
      const payload = { ...input, id: user.id };
      payload.daytime = payload.daytime.value;
      payload.category = payload.category.value;
      createEvent(payload).then(() => {
        router.push('/user/profile');
      });
    }
  };

  const uploadImage = (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      uploadPhoto(file).then((data) => {
        const imageObj = {
          url: data.url,
          publicId: data.public_id,
        };
        setInput((prevState) => ({
          ...prevState,
          photos: [...prevState.photos,
            imageObj],
        }));
      });
    }
  };

  const removePhoto = (image) => {
    setInput((prevState) => {
      const prevCopy = { ...prevState };
      const index = prevCopy.photos.findIndex((imageObj) => imageObj.url === image.url);
      prevCopy.photos.splice(index, 1);
      return prevCopy;
    });
    deletePhoto(image);
  };

  const handelCancel = () => {
    const { photos } = input;
    const cldDelete = photos.filter((photo) => !photo.id);
    const deletePhotos = cldDelete.map((photo) => deletePhoto(photo));
    Promise.all(deletePhotos).then(() => {
      router.push('/user/profile');
    });
  };

  // TOM TOM API//
  const locationOptions = (target) => new Promise((resolve, reject) => {
    getPoi(target, user.lat, user.long).then((placesArr) => {
      resolve(placesArr.filter((place) => place.value.toLowerCase().includes(target.toLowerCase())));
    }).catch(reject);
  });

  const cityOptions = (target) => new Promise((resolve, reject) => {
    getCity(target).then((cityArr) => {
      resolve(cityArr.filter((city) => city.value.toLowerCase().includes(target.toLowerCase())));
    }).catch(reject);
  });

  const handleLocationSelect = (selected) => {
    if (selected) {
      if (selected.city) {
        const {
          name, value, lat, long,
        } = selected;
        const city = `${selected.city}, ${selected.state}`;
        setInput((prevState) => ({
          ...prevState,
          [name]: value,
          city,
          lat,
          long,
        }));
      } else {
        const { value } = selected;
        setInput((prevState) => ({
          ...prevState,
          location: value,
        }));
      }
    } else {
      setInput((prevState) => ({
        ...prevState,
        location: '',
      }));
    }
  };
  const handleCitySelect = (selected) => {
    if (selected) {
      const { value } = selected;
      setInput((prevState) => ({
        ...prevState,
        city: value,
      }));
    } else {
      setInput((prevState) => ({
        ...prevState,
        city: '',
      }));
    }
  };

  useEffect(() => {
    if (obj.id) {
      setInput({
        ...obj,
        daytime: { value: obj.daytime.id, label: obj.daytime.name },
        category: { value: obj.category.id, label: obj.category.name },
      });
    }
  }, [obj]);

  return (
    <>
      <h4>{obj.id ? 'Edit' : 'Create'} Event</h4>
      <Form className="event-from" onSubmit={handleSubmit}>
        <div className="event-form-columns">
          <div className="event-form-title-date">
            <div>
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" value={input.title} onChange={handleChange} type="text" placeholder="Title Your Event" required />
            </div>
            <div>
              <Form.Label>Date</Form.Label>
              <Form.Control name="date" value={input.date} onChange={handleChange} type="date" required />
            </div>
          </div>
          <div className="event-form-time-category">
            <div>
              <Form.Label>Time of Day</Form.Label>
              <AsyncSelect
                cacheOptions
                loadOptions={getDaytimes}
                onChange={handleDaytime}
                defaultOptions
                value={input.daytime}
              />
            </div>
            <div>
              <Form.Label>Category</Form.Label>
              <AsyncSelect
                cacheOptions
                loadOptions={getCategories}
                onChange={handleCategory}
                defaultOptions
                value={input.category}
              />
            </div>
          </div>
          <div className="event-form-location-city">
            <div>
              <Form.Label>Location</Form.Label>
              <AsyncCreatable
                classNamePrefix="select"
                backspaceRemovesValue
                isClearable
                onChange={handleLocationSelect}
                value={{ label: input.location, value: input.location }}
                loadOptions={locationOptions}
                required
              />
            </div>
            <div>
              <Form.Label>City</Form.Label>
              <AsyncCreatable
                classNamePrefix="select"
                backspaceRemovesValue
                isClearable
                onChange={handleCitySelect}
                value={{ label: input.city, value: input.city }}
                loadOptions={cityOptions}
                required
              />
            </div>
          </div>
        </div>
        <div className="event-form-description">
          <Form.Label>Describe Your Experience</Form.Label>
          <Form.Control as="textarea" rows={3} name="description" value={input.description} onChange={handleChange} placeholder="Tell the people about it" required />
        </div>
        <div className="event-Star-And-Public">
          <div className="event-form-star-rating-div">
            <Rating
              allowHover={false}
              showTooltip
              size={26}
              allowHalfIcon
              tooltipArray={['Bad', 'Bad', 'Not Bad', 'Not Bad', 'Good', 'Good', 'Great', 'Great', 'Awesome', 'M.A.D. Awesome']}
              ratingValue={input.rating}
              onClick={handleRating}
              tooltipStyle={{
                height: 'auto', width: 'auto', fontSize: '13px', padding: '2px 4px', textAlign: 'center', marginTop: '4px', marginLeft: '10px',
              }}
            />
          </div>
          <Form.Check
            className="event-form-public-check"
            name="public"
            onChange={handleChange}
            checked={input.public}
            type="switch"
            id="custom-switch"
            label="Make it Public ?"
          />
        </div>
        <div className="event-Image-Upload-Div">
          <Form.Label>Upload Photos</Form.Label>
          <Form.Control type="file" onChange={uploadImage} />
        </div>
        <div className="uploaded-Images-Div">
          {input.photos?.map((photo) => (
            <div key={photo.url} className="uploaded-Images-Container">
              <Image className="event-Form-Photos" rounded src={photo.url} />
              <CloseButton onClick={() => removePhoto(photo)} className="image-Delete" />
            </div>
          ))}
        </div>
        <div className="event-form-buttons">
          <Button className="submit-btn" type="submit" variant="success">{obj.id ? 'Update' : 'Submit'}</Button>
          <Button className="cancel-btn" variant="danger" onClick={handelCancel}>Cancel</Button>
        </div>
      </Form>
    </>
  );
}

EventForm.propTypes = {
  obj: PropTypes.shape({
    title: PropTypes.string,
    date: PropTypes.string,
    daytime: PropTypes.string,
    category: PropTypes.string,
    location: PropTypes.string,
    city: PropTypes.string,
    description: PropTypes.string,
    starRating: PropTypes.number,
    isPublic: PropTypes.bool,
    uid: PropTypes.string,
    id: PropTypes.number,
  }),
};

EventForm.defaultProps = {
  obj: initialState,
};

export default EventForm;
