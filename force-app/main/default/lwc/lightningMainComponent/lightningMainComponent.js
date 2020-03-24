import { LightningElement, track, wire, api } from 'lwc';
import getContactList from '@salesforce/apex/ContactController.getContactList';
import searchContactsList from '@salesforce/apex/customSearchController.searchContactsList';
import { deleteRecord } from 'lightning/uiRecordApi';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import FIRSTNAME_FIELD from '@salesforce/schema/Contact.FirstName';
import LASTNAME_FIELD from '@salesforce/schema/Contact.LastName';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import CONTACT_LEVEL_FIELD from '@salesforce/schema/Contact.Contact_Level__c';
import ACCOUNT_FIELD from '@salesforce/schema/Contact.AccountId';
import { refreshApex } from '@salesforce/apex';

const columns = [
  { label: 'Name', fieldName: 'recordUrl', type: 'url', typeAttributes: { label:{fieldName:'Name'}, tooltip:{fieldName:'Name'}, target: '_parent'}, sortable: true},
  { label: 'Email', fieldName: 'Email', type: 'email', sortable: true },
  { label: 'Contact Level', fieldName: 'Contact_Level__c', type: 'text'/*, sortable: true*/},/*Contact_Level__c*/
  { label: 'Account', fieldName: 'AccountId', type: 'url', typeAttributes: { label:{fieldName:'AccountName'}, tooltip:{fieldName:'AccountName'}, target: '_parent'}, sortable: true},
  { label: 'Created By', fieldName: 'CreatedById', type: 'url', typeAttributes: { label:{fieldName:'CreatedByName'}, tooltip:{fieldName:'CreatedByName'}, target: '_parent'}, sortable: true},
  { label: 'Owner', fieldName: 'OwnerId', type: 'url', typeAttributes: { label:{fieldName:'OwnerName'}, tooltip:{fieldName:'OwnerName'}, target: '_parent'}, sortable: true},
  { label: 'Created Date', fieldName: 'CreatedDate', type: 'date', sortable: true },
  { type: 'button', typeAttributes: { label: 'Delete', name: 'delete' } },
];

export default class LightningMainComponent extends LightningElement {
  @api recordId;
  @track columns = columns;
  @track contacts;
  @track error;
  @track defaultSortDirection = 'asc';
  @track sortDirection = 'asc';
  @track sortedBy;
  @track openModalVar = false;
  contactObject = CONTACT_OBJECT;
  myFields = [FIRSTNAME_FIELD, LASTNAME_FIELD, EMAIL_FIELD, CONTACT_LEVEL_FIELD, ACCOUNT_FIELD];
  firstNameField = FIRSTNAME_FIELD;
  lastNameField = LASTNAME_FIELD;
  emailField = EMAIL_FIELD;
  contactLevelField = CONTACT_LEVEL_FIELD;
  accountField = ACCOUNT_FIELD;

  sVal = '';
  //cloneData = '123';

  /*@track page = 1; //this is initialize for 1st page
  @track items = []; //it contains all the records.
  //@track data = []; //data to be display in the table
  //@track columns; //holds column info.
  @track startingRecord = 1; //start record position per page
  @track endingRecord = 0; //end record position per page
  @track pageSize = 10; //default value we are assigning
  @track totalRecountCount = 0; //total record count received from all retrieved records
  @track totalPage = 0; //total number of page is needed to display all records*/

  @wire(getContactList)
  wiredContacts({ error, data }) {
      if (data) {
            this.contacts = this.prepareContactListForTableInsert(data);
      } else if (error) {
          this.error = error;
          this.contacts = undefined;
      }
  }

      sortBy(field, reverse, primer) {
        const key = primer
            ? function(x) {
                  return primer(x[field]);
              }
            : function(x) {
                  return x[field];
              };

        return function(a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
      }

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.contacts];
        //let cloneData;
        //alert('1');
        /*getContactList()
        .then(result => {
            // set @track contacts variable with return contact list from server
            this.contacts = this.prepareContactListForTableInsert(result, true);
        });
        alert(this.contacts);*/
        let fieldName;

        switch (sortedBy) {
            case 'recordUrl':
              fieldName = 'Name';
              break;
            case 'Email':
              fieldName = 'Email';
              break;
            case 'ContactLevelName':
              fieldName = 'ContactLevelName';
              break;
            case 'AccountId':
              fieldName = 'AccountName';
              break;
            case 'CreatedById':
              fieldName = 'CreatedByName';
              break;
            case 'OwnerId':
              fieldName = 'OwnerName';
              break;
            case 'CreatedDate':
              fieldName = 'CreatedDate';
              break;
          }
          //alert('3');
        cloneData.sort(this.sortBy(fieldName, sortDirection === 'asc' ? 1 : -1));
        this.contacts = cloneData;
        //this.contacts.sort(this.sortBy(fieldName, sortDirection === 'asc' ? 1 : -1));
        //alert('3');
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }

    handleRowAction(event) {

        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':

                deleteRecord(row.recordId);
                this.deleteRow(row);

                break;
            default:
        }
    }

    deleteRow(row) {
        const { recordId } = row;
        //alert(recordId);
        const index = this.findRowIndexById(recordId);
        if (index !== -1) {
            this.contacts = this.contacts
                .slice(0, index)
                .concat(this.contacts.slice(index + 1));
        }
    }

    findRowIndexById(id) {
        let ret = -1;
        this.contacts.some((row, index) => {
            //alert(row.recordId);
            if (row.recordId === id) {
                ret = index;
                return true;
            }
            return false;
        });
        return ret;
    }

    // update sVal var when input field value change
    updateSearchKey(event) {
        this.sVal = event.target.value;
    }

    // call apex method on button click
    handleSearch() {
        // if search input value is not blank then call apex method, else display error msg
        if (!this.isEmpty(this.sVal)) {
            searchContactsList({
                    searchKey: this.sVal.trim()
                })
                .then(result => {
                    // set @track contacts variable with return contact list from server
                    this.contacts = this.prepareContactListForTableInsert(result);
                })
                .catch(error => {
                    // display server exception in toast msg
                    const event = new ShowToastEvent({
                        title: 'Error',
                        variant: 'error',
                        message: error.body.message,
                    });
                    this.dispatchEvent(event);
                    // reset contacts var with null
                    this.contacts = null;
                });
        } else {
            // fire toast event if input field is blank
            const event = new ShowToastEvent({
                variant: 'error',
                message: 'Search text missing..',
            });
            this.dispatchEvent(event);
        }
    }

    isEmpty(str) {
        if (str.trim() == '')
          return true;

        return false;
      }

      prepareContactListForTableInsert(data){
        let rows = [];
        data.forEach( function( contact ){

            // ES2015 (ES6) Object constructor: Object.assign | This new method allows to easily copy values from one object to another.
            const contactObj = Object.assign({}, contact, {
                recordId: contact.Id,
                recordUrl: '/lightning/r/Contact/'+contact.Id+'/view',
                OwnerId: '/lightning/r/User/'+contact.Owner.Id+'/view',
                OwnerName: contact.Owner.Name,
                AccountId: '/lightning/r/Account/'+contact.Account.Id+'/view',
                AccountName: contact.Account.Name,
                CreatedById: '/lightning/r/User/'+contact.CreatedBy.Id+'/view',
                CreatedByName: contact.CreatedBy.Name,
            });
            rows.push(contactObj);
        });

        /*this.items = rows;
        this.totalRecountCount = rows.length; //here it is 23
        this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); //here it is 5
        this.endingRecord = this.pageSize;*/
        //this.columns = columns;
        //alert(rows1.length);

        //return rows.slice(0,this.pageSize);

        return rows;
      }

    //clicking on previous button this method will be called
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //clicking on next button this method will be called
    nextHandler() {
        if((this.page<this.totalPage) && this.page !== this.totalPage){
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //this method displays records page by page
    displayRecordPerPage(page){

            /*let's say for 2nd page, it will be => "Displaying 6 to 10 of 23 records. Page 2 of 5"
            page = 2; pageSize = 5; startingRecord = 5, endingRecord = 10
            so, slice(5,10) will give 5th to 9th records.
            */
            this.startingRecord = ((page -1) * this.pageSize) ;
            this.endingRecord = (this.pageSize * page);

            this.endingRecord = (this.endingRecord > this.totalRecountCount)
                                ? this.totalRecountCount : this.endingRecord;

            //this.data = this.items.slice(this.startingRecord, this.endingRecord);
            this.contacts= this.items.slice(this.startingRecord, this.endingRecord);

            //increment by 1 to display the startingRecord count,
            //so for 2nd page, it will show "Displaying 6 to 10 of 23 records. Page 2 of 5"
            this.startingRecord = this.startingRecord + 1;
    }

      openmodal() {
          this.openModalVar = true
      }
      closeModal() {
          this.openModalVar = false
      }


      handleContactCreated(){


        getContactList()
        .then(result => {
            this.closeModal();
            this.contacts = this.prepareContactListForTableInsert(result);
        });

       // this.closeModal();
      }

}
