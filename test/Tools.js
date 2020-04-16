const tools = require("./../includes/Tools");
const expect = require('chai').expect;

describe('Tools.quotationEncoder()', function() {
  context('without arguments', function() {
    it('should return ""', function() {
      expect(tools.quotationEncoder()).to.equal("")
      expect(tools.quotationEncoder("")).to.equal("")
    })
  })
  context('with odd number of quotation marks', function() {
    it('should return the initial argument', function() {
      expect(tools.quotationEncoder("\"hjasd \" asjd\"")).to.equal("\"hjasd \" asjd\"")
      expect(tools.quotationEncoder("hjasd \" asjd")).to.equal("hjasd \" asjd")
    })
  })
  context('with no quotation marks', function() {
    it('should return the initial argument', function() {
      expect(tools.quotationEncoder("hjasd  asjd")).to.equal("hjasd  asjd")
    })
  })

  context('with additional tests', function() {
    // Additional Test Cases
    it('should return the correct encoding', function() {
      expect(tools.quotationEncoder("abcde \"abcdef asd\"")).to.equal("abcde abcdef%space%asd")
    })
    it('should return the correct encoding', function() {
      expect(tools.quotationEncoder("abcde \"abcdef asd\" asd \"abcdef asd\"")).to.equal("abcde abcdef%space%asd asd abcdef%space%asd")
    })
    it('should return the correct encoding', function() {
      expect(tools.quotationEncoder("abcde \"abcdef asd\" \"abcdef asd\"")).to.equal("abcde abcdef%space%asd abcdef%space%asd")
    })
    it('should return the correct encoding', function() {
      expect(tools.quotationEncoder("abcde \" \"")).to.equal("abcde %space%")
    })
  })
})
