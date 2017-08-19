module.exports = {
  reformat_date: function(date_string) {
    let obj = new Date(date_string);

    let m = obj.getMonth() + 1,
        d = obj.getDate(),
        y = obj.getFullYear();

    if ( m < 10 ) {
      m = "0" + m;
    }

    if ( d < 10 ) {
      d = "0" + d;
    }

    return `${y}-${m}-${d}`;
  },

  node_text(node) {
    if ( ! node || ! node.innerHTML ) return "";
    return node.innerHTML
      .replace(/<.*?>/g, '')
      .replace(/&amp;/gi, '&')
      .replace(/[ ]+/g, ' ')
  }
};
