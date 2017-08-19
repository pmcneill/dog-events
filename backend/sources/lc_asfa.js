const fs = require('fs'),
      jsdom = require('jsdom'),
      util = require('../util'),
      geo = require('../geo');
    
module.exports = {
  fetch_year: async function(year) {
    let data = fs.readFileSync('sources/asfa-2017');
    
    data = data.toString()
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
            type;

        if ( raw_type == 'AB' ) {
          type = 'All Breed';
        } else if ( raw_type.indexOf('REG') === 0 ) {
          type = 'Regional';
        } else if ( raw_type == 'ASFA II' ) {
          type = 'International Invitational';
        } else {
          type = `Breed: ${raw_type}`;
        }

        let club = util.node_text(cells[9]),
            city = util.node_text(cells[10]),
            state = util.node_text(cells[11]),
            { latitude, longitude, zip_id } = await geo.coords_by_city(city, state),
            premium = '';

        if ( cells[13].innerHTML != '' ) {
          let link_nodes = cells[13].getElementsByTagName('a');
    
          if ( link_nodes.length ) {
            premium = 'http://www.asfa.org/events/' + link_nodes[0].getAttribute('href');
          }
        }
    
        for ( let date of dates ) {
          events.push({
            club,
            city,
            state,
            zip_id,
            latitude,
            longitude,
            type,
            date,
            premium,
          });
        }
      }
    }

    return events;
  }
};
