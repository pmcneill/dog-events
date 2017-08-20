const fs = require('fs'),
      jsdom = require('jsdom'),
      util = require('../util'),
      geo = require('../geo'),
      rp = require('request-promise-native');
  
module.exports = async function() {
  let now = new Date(),
      year = now.getFullYear();

  const lc_type_id = await util.type_id_for('Lure Coursing');

  let data = await rp.get('http://www.asfa.org/event/index2017.htm');
  
  data = data
    .replace(/&nbsp;/ig, '')
    .replace(/\r/g, '')
    .replace(/^@import.*$/mg, '')
    .replace(/<!--.*?-->/g, '');
  
  let dom = new jsdom.JSDOM(data);
  
  let months = dom.window.document.getElementsByClassName('TabbedPanelsContent');
  
  let events = [];
  
  for ( let month of months ) {
    let rows = month.getElementsByTagName('tr');
  
    let month_name = rows[0].getElementsByTagName('span')[0].innerHTML;
    
    for ( let i = 2 ; i < rows.length ; i++ ) {
      let cells = rows[i].getElementsByTagName('td');

      if ( cells.length < 12 || util.node_text(cells[0]) == 'F') {
        continue;
      }
  
      let dates = [];
  
      // First 7 are days of the week, starting on Friday.  If there's text, it's
      // the day of the month
  
      for ( let d = 0 ; d < 7 ; d++ ) {
        if ( cells[d].innerHTML != '' ) {
          let day = util.node_text(cells[d]);
  
          dates.push(util.reformat_date(`${month_name} ${day}, ${year}`));
        }
      }
  
      let raw_type = util.node_text(cells[7]),
          description;

      if ( raw_type == 'AB' ) {
        description = 'All Breed';
      } else if ( raw_type.indexOf('REG') === 0 ) {
        description = 'Regional';
      } else if ( raw_type == 'ASFA II' ) {
        description = 'International Invitational';
      } else {
        description = `Breed: ${raw_type}`;
      }

      let club = util.node_text(cells[9]),
          city = util.node_text(cells[10]),
          state = util.node_text(cells[11]),
          { latitude, longitude, zip_id } = await geo.coords_by_city(city, state),
          premium_url = '';

      if ( cells[13].innerHTML != '' ) {
        let link_nodes = cells[13].getElementsByTagName('a');
  
        if ( link_nodes.length ) {
          premium_url = 'http://www.asfa.org/event/' + link_nodes[0].getAttribute('href');
        }
      }
  
      for ( let date of dates ) {
        events.push({
          type_id: lc_type_id,
          club,
          city,
          state,
          zip_id,
          latitude,
          longitude,
          description,
          date,
          premium_url,
        });
      }
    }
  }

  return events;
};
