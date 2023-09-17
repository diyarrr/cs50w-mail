// TO DO
// Compose email and Re part




document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');
});

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
    displayEmails(emails, mailbox);
  });
}


function compose_email(recipient = '', subject = '', reply_body = '') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  
  // Clear out composition fields
  //document.querySelector('#compose-recipients').value = recipient;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = reply_body;

  if (typeof recipient === 'string') {
    document.querySelector('#compose-recipients').value = recipient;
  } else {
    document.querySelector('#compose-recipients').value = '';
  }


  // Add an event listener to the submit button to send the email
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent the default form submission
    send_mail(); // Call the send_mail function to send the email
  });

}


// Function to create an email box
function createEmailBox(email, mailbox) {
  const emailBox = document.createElement("div");
  emailBox.className = "email-box"; // Add a class for styling
  emailBox.innerHTML = `
    <p class="sender"><strong>${email.sender}</strong></p>
    <p class="subject">${email.subject}</p>
    <p class="timestamp">${email.timestamp}</p>
  `;

  emailBox.addEventListener('click', () => {
    view_email(email, mailbox);
  });

  return emailBox;
}

// Function to add email boxes to the container
function displayEmails(emails, mailbox) {
  const emailContainer = document.getElementById("emails-view");
  emails.forEach((email) => {
    const emailBox = createEmailBox(email, mailbox);
    if(email.read == true)
      emailBox.style.backgroundColor = 'gray';
    else
      emailBox.style.backgroundColor = 'white';

    emailContainer.appendChild(emailBox);
  });
}


// send mail
function send_mail() {

  console.log("sending...");
  // get inputs
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });


}


// Add an event listener to handle the "Reply" button click for all email boxes
document.addEventListener('click', function(event) {
  if (event.target && event.target.className === 'reply-button') {
    // Find the email box that contains the clicked "Reply" button
    const emailBox = event.target.closest('.content');
    
    // Extract the subject, recipient, time and body information from the email box
    const senderElement = emailBox.querySelector('#sender');
    const senderText = senderElement.textContent.replace('From:', '');
    


    const subjectElement = emailBox.querySelector('#subject');
    const subjectText = subjectElement.textContent.replace('Subject:', '');

    // if the subject field already contains "Re:" remove it
    if(subjectText.subString("Re:")) 
    {
      const subject = `Re: ${subjectText.replace("Re:", "")}`;
    }
    else 
    {
      const subject = `Re: ${subjectText}`;
    }

    const timeElement = emailBox.querySelector('#timestamp');
    const timeText = timeElement.textContent.replace('Timestamp', '');

    const body = emailBox.querySelector('#email-body').textContent;
    
    const reply_body = `On ${timeText} ${senderText} wrote: ${body}`;


    compose_email(senderText, subject, reply_body);
  }
});


// When a user clicks on an email, the user should be taken to a view where they see the content of that email.
function view_email(email, mailbox) 
{
  email_id = email.id;
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // get content view query
  content_view = document.querySelector('#content-view');
  const emailBox = document.createElement("div");

  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {

    emailBox.className = "content";
    emailBox.innerHTML = `
      <p id="sender"><strong>From:</strong> ${email.sender}</p>
      <p id="recipients"><strong>To:</strong> ${email.recipients}</p>
      <p id="subject"><strong>Subject:</strong> ${email.subject}</p>
      <p id="timestamp"><strong>Timestamp:</strong> ${email.timestamp}</p>
      <p id="email-body">${email.body}</p>
      <div class="buttons">
      <button class="reply-button">Reply</button>
      <button class="archive-button">Archive</button>
      <button class="unarchive-button">Unarchive</button>
      </div>
    `;
    
    // call archive and unarchive function
    archive(emailBox, email, mailbox);

    });


    // Remove any existing emailBox element from content_view
    const existingEmailBox = content_view.querySelector('.content');
    if (existingEmailBox) {
      content_view.removeChild(existingEmailBox);
    }

    content_view.append(emailBox);

    content_view.style.display = 'block';

    // mark email as read
    fetch('/emails/' + email_id, { 
      method : 'PUT',
      body : JSON.stringify({
        read : true
      }
      )
    })

}




function archive(emailBox, email, mailbox) 
{

  // archive and unarchive toggle according to the email
  const archiveButton = emailBox.querySelector('.archive-button');
  const unarchiveButton = emailBox.querySelector('.unarchive-button');

  // make them invisible
  archiveButton.style.display = 'none';
  unarchiveButton.style.display = 'none';

  // if the mailbox is not the sentbox then we can see the archive and unarchive buttons
  if(mailbox != 'sent') 
  {
    if (email.archived) {
      unarchiveButton.style.display = 'block';
    } else {
      archiveButton.style.display = 'block';
    }
    archiveButton.addEventListener('click', () => {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
      .then(() => {
        // Update the UI to reflect the archived state
        archiveButton.style.display = 'none';
        unarchiveButton.style.display = 'none';
        // load inbox
        load_mailbox('inbox')
      });
    });
    
    unarchiveButton.addEventListener('click', () => {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      .then(() => {
        // Update the UI to reflect the unarchived state
        archiveButton.style.display = 'none';
        unarchiveButton.style.display = 'block';
        // load inbox
        load_mailbox('inbox');
      });
    });

  }

}