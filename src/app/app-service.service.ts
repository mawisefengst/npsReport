import { Injectable } from '@angular/core';
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import {environment} from "../environments/environment"

@Injectable()
export class AppServiceService {
  npsUri = "";
  allClientsUri = "";
  constructor(private http: Http) { 
  	if(environment.production){
  		this.npsUri = "https://stagingsecure.sportssystems.com/api/photosite/npsAverage/";
  	  this.allClientsUri = "https://stagingsecure.sportssystems.com/api/photosite/allclients/";
    }else{
      this.npsUri = "assets/nps.json";
      this.allClientsUri = "assets/allclients.json"
  	}
  }

  getAllClients(){
     return this.http
      .get(this.allClientsUri)
      .map(response => response.json())
  }

  getUrl(){
  	return this.http
  		.get(this.npsUri)
  		.map(response => response.json())
  }

}
