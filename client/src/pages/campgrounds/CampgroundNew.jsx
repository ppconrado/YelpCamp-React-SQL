import React, { useEffect } from 'react';
import CampgroundForm from '../../components/CampgroundForm';
import CenteredCard from '../../components/ui/CenteredCard';

const CampgroundNew = () => {
  useEffect(() => {
    // SPA feel: grey bg + inner scroll with static header/footer
    document.body.classList.remove('home-hero');
    document.body.classList.add('camp-list-bg');
    document.body.classList.add('camp-scroll');
    return () => {
      document.body.classList.remove('camp-list-bg');
      document.body.classList.remove('camp-scroll');
    };
  }, []);

  return (
    <div className="camp-scroll-inner">
      <CenteredCard
        title="New Campground"
        subtitle="Compartilhe um novo local para acampar"
      >
        <CampgroundForm />
      </CenteredCard>
    </div>
  );
};

export default CampgroundNew;
