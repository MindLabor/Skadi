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

describe('Tools.wordWrap(str, maxWidth)', function() {
  context('empty input', function() {
    it('should return ""', function() {
      expect(tools.wordWrap("", 120)).to.eql([])
      expect(tools.wordWrap("", 0)).to.eql([])
    })
  })
  context('with no overflow', function() {
    it('should return array of input', function() {
      expect(tools.wordWrap("abc", 6)).to.eql(["abc"])
    })
  })

  context('with overflow', function() {
    it('should be', function() {
      expect(tools.wordWrap("abcabcabcabcabcabcabcabcabc", 6)).to.eql(["abcabc","abcabc","abcabc","abcabc","abc"])
    })
  })
})
