var request = require('supertest');
var express = require('express');
var expect = require('chai').expect;
var app = require('../server-config.js');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');

/////////////////////////////////////////////////////
// NOTE: these tests are designed for mongo!
/////////////////////////////////////////////////////

describe('', function () {

  beforeEach(function (done) {
    // Log out currently signed in user
    request(app)
      .get('/logout')
      .end(function (err, res) {

        // Delete objects from db so they can be created later for the test
        Links
          .query('where', 'url', '=', 'http://www.roflzoo.com/')
          .fetch()
          .then(function (collection) {
            if (collection.at(0)) {
              collection.at(0).destroy();
            }
            Users
              .query('where', 'username', '=', 'Savannah')
              .fetch()
              .then(function (collection) {
                if (collection.at(0)) {
                  collection.at(0).destroy();
                }
                Users
                  .query('where', 'username', '=', 'Phillip')
                  .fetch()
                  .then(function (collection) {
                    if (collection.at(0)) {
                      collection.at(0).destroy();
                    }
                    done();
                  });
              });
          });
      });
  });

  describe('Link creation: ', function () {

    it('Only shortens valid urls, returning a 404 - Not found for invalid urls', function (done) {
      request(app)
        .post('/links')
        .send({
          'url': 'definitely not a valid url'
        })
        .expect(404)
        .end(done);
    });

    describe('Shortening links:', function () {

      it('Responds with the short code', function (done) {
        request(app)
          .post('/links')
          .send({
            'url': 'http://www.roflzoo.com/'
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.url).to.equal('http://www.roflzoo.com/');
            expect(res.body.code).to.be.ok;
          })
          .end(done);
      });

      it('New links create a database entry', function (done) {
        request(app)
          .post('/links')
          .send({
            'url': 'http://www.roflzoo.com/'
          })
          .expect(200)
          .end(function () {
            Links.query('where', 'url', '=', 'http://www.roflzoo.com/')
              .fetch()
              .then(function (coll) {
                expect(coll.at(0).get('url')).to.equal('http://www.roflzoo.com/');
                done();
              });
          });
      });

      it('Fetches the link url title', function (done) {
        request(app)
          .post('/links')
          .send({
            'url': 'http://www.roflzoo.com/'
          })
          .expect(200)
          .end(function () {
            Links.query('where', 'url', '=', 'http://www.roflzoo.com/')
              .fetch()
              .then(function (coll) {
                console.log(coll.at(0).get('title'));
                expect(coll.at(0).get('title')).to.equal('Funny animal pictures, funny animals, funniest dogs');
                done();
              });
          });
      });

    }); // 'Shortening Links'

    describe('With previously saved urls: ', function () {
      var __link;
      beforeEach(function (done) {
        __link = new Link({
          url: 'http://www.roflzoo.com/',
          title: 'Rofl Zoo - Daily funny animal pictures',
          base_url: 'http://127.0.0.1:4568',
          visits: 0
        })
        __link.save()
          .then(function () {
            done();
          });
      });

      it('Returns the same shortened code if attempted to add the same URL twice', function (done) {
        var firstCode = __link.get('code');
        console.log('firstCode: ', firstCode);
        request(app)
          .post('/links')
          .send({
            'url': 'http://www.roflzoo.com/'
          })
          .expect(200)
          .expect(function (res) {
            var secondCode = res.body.code;
            expect(secondCode).to.equal(firstCode);
          })
          .end(done);
      });

      it('Shortcode redirects to correct url', function (done) {
        var sha = __link.get('code');
        request(app)
          .get('/' + sha)
          .expect(302)
          .expect(function (res) {
            var redirect = res.headers.location;
            expect(redirect).to.equal('http://www.roflzoo.com/');
          })
          .end(done);
      });

    }); // 'With previously saved urls'

  }); // 'Link creation'

  describe('Priviledged Access:', function () {

    // /*  Authentication  */
    // // TODO: xit out authentication
    it('Redirects to login page if a user tries to access the main page and is not signed in', function (done) {
      request(app)
        .get('/')
        .expect(302)
        .expect(function (res) {
          expect(res.headers.location).to.equal('/login');
        })
        .end(done);
    });

    it('Redirects to login page if a user tries to create a link and is not signed in', function (done) {
      request(app)
        .get('/create')
        .expect(302)
        .expect(function (res) {
          expect(res.headers.location).to.equal('/login');
        })
        .end(done);
    });

    it('Redirects to login page if a user tries to see all of the links and is not signed in', function (done) {
      request(app)
        .get('/links')
        .expect(302)
        .expect(function (res) {
          expect(res.headers.location).to.equal('/login');
        })
        .end(done);
    });

  }); // 'Privileged Access'

  describe('Account Creation:', function () {

    it('Signup creates a new user', function (done) {
      request(app)
        .post('/signup')
        .send({
          'username': 'Svnh',
          'password': 'Svnh'
        })
        .expect(302)
        .expect(function () {
          User.findOne({
              'username': 'Svnh'
            })
            .exec(function (err, user) {
              expect(user.username).to.equal('Svnh');
            });
        })
        .end(done);
    });

    it('Successful signup logs in a new user', function (done) {
      request(app)
        .post('/signup')
        .send({
          'username': 'Phillip',
          'password': 'Phillip'
        })
        .expect(302)
        .expect(function (res) {
          expect(res.headers.location).to.equal('/');
          request(app)
            .get('/logout')
            .expect(200)
        })
        .end(done);
    });

  }); // 'Account Creation'

  describe('Account Login:', function () {

    beforeEach(function (done) {
      new User({
        'username': 'Phillip',
        'password': 'Phillip'
      }).save(function () {
        done();
      });
    });

    it('Logs in existing users', function (done) {
      request(app)
        .post('/login')
        .send({
          'username': 'Phillip',
          'password': 'Phillip'
        })
        .expect(302)
        .expect(function (res) {
          expect(res.headers.location).to.equal('/');
        })
        .end(done);
    });

    it('Users that do not exist are kept on login page', function (done) {
      request(app)
        .post('/login')
        .send({
          'username': 'Fred',
          'password': 'Fred'
        })
        .expect(302)
        .expect(function (res) {
          expect(res.headers.location).to.equal('/login');
        })
        .end(done)
    });

  }); // Account Login

});