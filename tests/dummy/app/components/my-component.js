import Ember from 'ember';
import layout from '../templates/components/my-component';

const {
  Component
} = Ember;

export default Component.extend({
  layout,
  classNames: ['bar']
});
