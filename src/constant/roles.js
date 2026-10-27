/* eslint-disable */
export const TYPE_LABEL={sell:"Selling",buy:"Sourcing",capital:"Raising",invest:"Investing",jv:"Seeking JV",export:"Exporting"};

export const ROLE_META={
  sell:{ic:"box",label:"Sell / Export",d:"I have products or services to sell"},
  buy:{ic:"cart",label:"Buy / Source",d:"I'm sourcing suppliers or products"},
  capital:{ic:"wallet",label:"Raise Capital",d:"I'm raising investment"},
  invest:{ic:"trend",label:"Invest / Fund",d:"I'm looking to deploy capital"},
  jv:{ic:"handshake",label:"Find a JV / Partner",d:"I'm seeking a joint-venture partner"},
  export:{ic:"globe",label:"Export / Trade",d:"I want to export goods to new markets"}
};

export const COMPAT={sell:["buy"],buy:["sell"],capital:["invest"],invest:["capital"],jv:["jv"],export:["buy","sell"]};

export const TIERS={bacc:{t:"BACC Member",d:"BRICS-ASEAN Chamber of Commerce -- full member",ic:"shield"},baicte:{t:"BAICT&E Member",d:"Independent Commission for Trade & Economy",ic:"building"},open:{t:"Open Listing",d:"Free public listing",ic:"globe"}};
